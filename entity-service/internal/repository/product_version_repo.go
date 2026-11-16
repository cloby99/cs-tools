// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
	"golang.org/x/sync/errgroup"
)

// ProductVersionRepository defines the persistence operations for the
// product_version table (migration 0016).
type ProductVersionRepository interface {
	// SearchProductVersions returns a filtered, paginated slice of product versions
	// together with the total count of matching rows before pagination.
	// COUNT and SELECT are executed concurrently on separate pool connections.
	SearchProductVersions(ctx context.Context, req domain.SearchProductVersionsRequest) ([]domain.ProductVersion, int, error)

	// CreateProductVersion adds a version to a software product. A product that
	// does not exist is a *apierror.NotFoundError, one that is not software a
	// *apierror.ValidationError, and a version already stored for the product
	// with the same deployment profile a *apierror.ConflictError.
	CreateProductVersion(ctx context.Context, productID string, v domain.NewProductVersion, actor string) (domain.ProductVersion, error)

	// UpdateProductVersion applies patch to a version of the product and returns
	// the stored row. A version that is not the product's is a
	// *apierror.NotFoundError; a change that would duplicate another version of
	// the product (same version string and deployment profile) is a
	// *apierror.ConflictError.
	UpdateProductVersion(ctx context.Context, productID, versionID string, patch domain.ProductVersionPatch, actor string) (domain.ProductVersion, error)
}

const productVersionColumns = `id, product_id, version, current_support_status,
	release_date, support_eol_date, earliest_possible_support_eol_date,
	deployment_profile, is_active, created_on, updated_on`

const errProductVersionExists = "this product already has that version with the same deployment profile"

type productVersionRepo struct {
	db *pgxpool.Pool
}

// NewProductVersionRepository constructs a ProductVersionRepository backed by the given connection pool.
func NewProductVersionRepository(db *pgxpool.Pool) ProductVersionRepository {
	return &productVersionRepo{db: db}
}

// SearchProductVersions implements ProductVersionRepository.
func (r *productVersionRepo) SearchProductVersions(ctx context.Context, req domain.SearchProductVersionsRequest) ([]domain.ProductVersion, int, error) {
	filterArgs := []any{}
	argIdx := 1

	where := "WHERE 1=1"
	if !req.IncludeInactive {
		where += " AND is_active"
	}

	if req.ProductID != "" {
		where += fmt.Sprintf(" AND product_id = $%d", argIdx)
		filterArgs = append(filterArgs, req.ProductID)
		argIdx++
	}

	if req.SearchQuery != "" {
		escaped := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(req.SearchQuery)
		pattern := "%" + escaped + "%"
		where += fmt.Sprintf(" AND (version ILIKE $%d ESCAPE '\\')", argIdx)
		filterArgs = append(filterArgs, pattern)
		argIdx++
	}

	// An empty profile (an explicit opt-out) applies no profile filter.
	if req.DeploymentProfile != nil && *req.DeploymentProfile != "" {
		where += fmt.Sprintf(" AND lower(deployment_profile) = lower($%d)", argIdx)
		filterArgs = append(filterArgs, *req.DeploymentProfile)
		argIdx++
	}

	countQuery := "SELECT COUNT(*) FROM product_version " + where

	dataQuery := fmt.Sprintf(
		`SELECT id, product_id, version, current_support_status,
		        release_date, support_eol_date, earliest_possible_support_eol_date,
		        deployment_profile, is_active, created_on, updated_on
		 FROM product_version %s
		 ORDER BY release_date DESC, id
		 LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)
	dataArgs := append(append([]any{}, filterArgs...), req.Pagination.Limit, req.Pagination.Offset)

	var total int
	var versions []domain.ProductVersion

	eg, egCtx := errgroup.WithContext(ctx)

	eg.Go(func() error {
		if err := r.db.QueryRow(egCtx, countQuery, filterArgs...).Scan(&total); err != nil {
			return fmt.Errorf("count product_version: %w", err)
		}
		return nil
	})

	eg.Go(func() error {
		rows, err := r.db.Query(egCtx, dataQuery, dataArgs...)
		if err != nil {
			return fmt.Errorf("query product_version: %w", err)
		}
		defer rows.Close()

		result := make([]domain.ProductVersion, 0, req.Pagination.Limit)
		for rows.Next() {
			var pv domain.ProductVersion
			if err := rows.Scan(
				&pv.ID, &pv.ProductID, &pv.Version, &pv.CurrentSupportStatus,
				&pv.ReleaseDate, &pv.SupportEOLDate, &pv.EarliestPossibleSupportEOLDate,
				&pv.DeploymentProfile, &pv.Active, &pv.CreatedOn, &pv.UpdatedOn,
			); err != nil {
				return fmt.Errorf("scan product_version: %w", err)
			}
			result = append(result, pv)
		}
		if err := rows.Err(); err != nil {
			return fmt.Errorf("iterate product_versions: %w", err)
		}
		versions = result
		return nil
	})

	if err := eg.Wait(); err != nil {
		return nil, 0, err
	}

	return versions, total, nil
}

func scanProductVersion(row pgx.Row) (domain.ProductVersion, error) {
	var pv domain.ProductVersion
	err := row.Scan(
		&pv.ID, &pv.ProductID, &pv.Version, &pv.CurrentSupportStatus,
		&pv.ReleaseDate, &pv.SupportEOLDate, &pv.EarliestPossibleSupportEOLDate,
		&pv.DeploymentProfile, &pv.Active, &pv.CreatedOn, &pv.UpdatedOn,
	)
	return pv, err
}

// productVersionExists reports whether the product already has a version with
// this string and deployment profile (both ignoring case), other than excludeID.
// product_version's unique key cannot do this on its own: a NULL profile never
// collides with another NULL, so the same profile-less version could be added
// twice.
func productVersionExists(ctx context.Context, q pgx.Tx, productID, version string, profile *string, excludeID string) (bool, error) {
	var exists bool
	err := q.QueryRow(ctx,
		`SELECT EXISTS (
		   SELECT 1 FROM product_version
		    WHERE product_id = $1
		      AND lower(version) = lower($2)
		      AND lower(deployment_profile) IS NOT DISTINCT FROM lower($3::text)
		      AND ($4 = '' OR id::text <> $4))`,
		productID, version, profile, excludeID).Scan(&exists)
	return exists, err
}

// CreateProductVersion implements ProductVersionRepository.
func (r *productVersionRepo) CreateProductVersion(ctx context.Context, productID string, v domain.NewProductVersion, actor string) (domain.ProductVersion, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.ProductVersion{}, fmt.Errorf("begin create product_version: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// NO KEY UPDATE serializes concurrent adds to one product without blocking
	// the FOR KEY SHARE that inserting a product_version takes on this row.
	var category string
	err = tx.QueryRow(ctx, `SELECT category::text FROM product WHERE id = $1 FOR NO KEY UPDATE`, productID).Scan(&category)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ProductVersion{}, &apierror.NotFoundError{Msg: "product not found"}
	}
	if err != nil {
		return domain.ProductVersion{}, fmt.Errorf("lock product: %w", err)
	}
	if category != "SOFTWARE" {
		return domain.ProductVersion{}, &apierror.ValidationError{Msg: "versions can only be added to software products"}
	}

	exists, err := productVersionExists(ctx, tx, productID, v.Version, v.DeploymentProfile, "")
	if err != nil {
		return domain.ProductVersion{}, fmt.Errorf("check duplicate product_version: %w", err)
	}
	if exists {
		return domain.ProductVersion{}, &apierror.ConflictError{Msg: errProductVersionExists}
	}

	created, err := scanProductVersion(tx.QueryRow(ctx,
		`INSERT INTO product_version
		   (id, created_on, updated_on, created_by, updated_by, product_id, version,
		    deployment_profile, current_support_status, release_date, support_eol_date,
		    earliest_possible_support_eol_date)
		 VALUES (uuidv7(), now(), now(), $1, $1, $2, $3, $4,
		         $5::product_version_support_status_enum, $6, $7, $8)
		 RETURNING `+productVersionColumns,
		actor, productID, v.Version, v.DeploymentProfile, strings.ToUpper(string(v.CurrentSupportStatus)),
		v.ReleaseDate, v.SupportEOLDate, v.EarliestPossibleSupportEOLDate))
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ProductVersion{}, &apierror.ConflictError{Msg: errProductVersionExists}
		}
		return domain.ProductVersion{}, fmt.Errorf("insert product_version: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.ProductVersion{}, fmt.Errorf("commit create product_version: %w", err)
	}
	return created, nil
}

// UpdateProductVersion implements ProductVersionRepository.
func (r *productVersionRepo) UpdateProductVersion(ctx context.Context, productID, versionID string, patch domain.ProductVersionPatch, actor string) (domain.ProductVersion, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.ProductVersion{}, fmt.Errorf("begin update product_version: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var curVersion string
	var curProfile *string
	err = tx.QueryRow(ctx,
		`SELECT version, deployment_profile FROM product_version WHERE id = $1 AND product_id = $2 FOR UPDATE`,
		versionID, productID).Scan(&curVersion, &curProfile)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ProductVersion{}, &apierror.NotFoundError{Msg: "product version not found"}
	}
	if err != nil {
		return domain.ProductVersion{}, fmt.Errorf("lock product_version: %w", err)
	}

	newVersion, newProfile := curVersion, curProfile
	if patch.Version != nil {
		newVersion = *patch.Version
	}
	if patch.DeploymentProfile.Set {
		newProfile = patch.DeploymentProfile.Value
	}
	if patch.Version != nil || patch.DeploymentProfile.Set {
		// Same advisory-free reasoning as create: lock the product row so two
		// renames to the same string cannot both pass the check.
		if _, err := tx.Exec(ctx, `SELECT 1 FROM product WHERE id = $1 FOR NO KEY UPDATE`, productID); err != nil {
			return domain.ProductVersion{}, fmt.Errorf("lock product: %w", err)
		}
		exists, err := productVersionExists(ctx, tx, productID, newVersion, newProfile, versionID)
		if err != nil {
			return domain.ProductVersion{}, fmt.Errorf("check duplicate product_version: %w", err)
		}
		if exists {
			return domain.ProductVersion{}, &apierror.ConflictError{Msg: errProductVersionExists}
		}
	}

	sets := []string{"updated_on = now()", "updated_by = $1"}
	args := []any{actor}
	add := func(column, cast string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s = $%d%s", column, len(args), cast))
	}
	if patch.Active != nil {
		add("is_active", "", *patch.Active)
	}
	if patch.Version != nil {
		add("version", "", *patch.Version)
	}
	if patch.DeploymentProfile.Set {
		add("deployment_profile", "", patch.DeploymentProfile.Value)
	}
	if patch.CurrentSupportStatus != nil {
		add("current_support_status", "::product_version_support_status_enum", strings.ToUpper(string(*patch.CurrentSupportStatus)))
	}
	if patch.ReleaseDate.Set {
		add("release_date", "", patch.ReleaseDate.Value)
	}
	if patch.SupportEOLDate.Set {
		add("support_eol_date", "", patch.SupportEOLDate.Value)
	}
	if patch.EarliestPossibleSupportEOLDate.Set {
		add("earliest_possible_support_eol_date", "", patch.EarliestPossibleSupportEOLDate.Value)
	}
	args = append(args, versionID)

	updated, err := scanProductVersion(tx.QueryRow(ctx,
		fmt.Sprintf(`UPDATE product_version SET %s WHERE id = $%d RETURNING %s`,
			strings.Join(sets, ", "), len(args), productVersionColumns),
		args...))
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ProductVersion{}, &apierror.ConflictError{Msg: errProductVersionExists}
		}
		return domain.ProductVersion{}, fmt.Errorf("update product_version: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.ProductVersion{}, fmt.Errorf("commit update product_version: %w", err)
	}
	return updated, nil
}
