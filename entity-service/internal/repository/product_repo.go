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

// ProductRepository defines the persistence operations for the product table
// (migration 0015). domain.Product.Class (values "software"/"service")
// maps to the real product.category column (product_category_enum: SOFTWARE/
// SERVICE) -- there is no "class" column or "product_class_enum" type in the
// migrations; category is the one real column with matching semantics
// (manufacturer/business_unit/unit are different classification axes on the
// same table, not substitutes for this one).
type ProductRepository interface {
	// SearchProducts returns a filtered, paginated slice of products together
	// with the total count of matching rows before pagination.
	// COUNT and SELECT are executed concurrently on separate pool connections.
	SearchProducts(ctx context.Context, req domain.SearchProductsRequest) ([]domain.Product, int, error)

	// CreateProduct inserts a product and returns it. A product with the same
	// name (ignoring case), class and unit already stored is a *apierror.ConflictError.
	CreateProduct(ctx context.Context, p domain.NewProduct, actor string) (domain.Product, error)

	// SetProductActive retires (false) or restores (true) a product. An unknown
	// id is a *apierror.NotFoundError. Setting the state it already has succeeds.
	SetProductActive(ctx context.Context, id string, active bool, actor string) (domain.Product, error)
}

type productRepo struct {
	db *pgxpool.Pool
}

// NewProductRepository constructs a ProductRepository backed by the given connection pool.
func NewProductRepository(db *pgxpool.Pool) ProductRepository {
	return &productRepo{db: db}
}

// SearchProducts implements ProductRepository.
func (r *productRepo) SearchProducts(ctx context.Context, req domain.SearchProductsRequest) ([]domain.Product, int, error) {
	filterArgs := []any{}
	argIdx := 1

	where := "WHERE 1=1"
	if !req.IncludeInactive {
		where += " AND is_active"
	}

	if req.SearchQuery != "" {
		escaped := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(req.SearchQuery)
		pattern := "%" + escaped + "%"
		where += fmt.Sprintf(" AND (name ILIKE $%d ESCAPE '\\')", argIdx)
		filterArgs = append(filterArgs, pattern)
		argIdx++
	}

	if req.Class != "" {
		where += fmt.Sprintf(" AND category = $%d::product_category_enum", argIdx)
		filterArgs = append(filterArgs, strings.ToUpper(string(req.Class)))
		argIdx++
	}

	countQuery := "SELECT COUNT(*) FROM product " + where

	dataQuery := fmt.Sprintf(
		`SELECT id, name, category, is_active, created_on, updated_on
		 FROM product %s
		 ORDER BY created_on DESC, id
		 LIMIT $%d OFFSET $%d`,
		where, argIdx, argIdx+1,
	)
	dataArgs := append(append([]any{}, filterArgs...), req.Pagination.Limit, req.Pagination.Offset)

	var total int
	var products []domain.Product

	eg, egCtx := errgroup.WithContext(ctx)

	eg.Go(func() error {
		if err := r.db.QueryRow(egCtx, countQuery, filterArgs...).Scan(&total); err != nil {
			return fmt.Errorf("count products: %w", err)
		}
		return nil
	})

	eg.Go(func() error {
		rows, err := r.db.Query(egCtx, dataQuery, dataArgs...)
		if err != nil {
			return fmt.Errorf("query products: %w", err)
		}
		defer rows.Close()

		result := make([]domain.Product, 0, req.Pagination.Limit)
		for rows.Next() {
			var p domain.Product
			var category string
			if err := rows.Scan(&p.ID, &p.Name, &category, &p.Active, &p.CreatedOn, &p.UpdatedOn); err != nil {
				return fmt.Errorf("scan product: %w", err)
			}
			p.Class = domain.ProductClass(strings.ToLower(category))
			result = append(result, p)
		}
		if err := rows.Err(); err != nil {
			return fmt.Errorf("iterate products: %w", err)
		}
		products = result
		return nil
	})

	if err := eg.Wait(); err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

// CreateProduct implements ProductRepository.
//
// The duplicate check is done here rather than left to product_name_category_unit_key:
// that constraint treats two NULL units as different, so it would let the same
// unit-less product be added twice. The advisory lock makes the check-then-insert
// atomic for two concurrent requests with the same name.
func (r *productRepo) CreateProduct(ctx context.Context, p domain.NewProduct, actor string) (domain.Product, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Product{}, fmt.Errorf("begin create product: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	category := strings.ToUpper(string(p.Class))
	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended('product:' || lower($1), 0))`, p.Name); err != nil {
		return domain.Product{}, fmt.Errorf("lock product name: %w", err)
	}

	var exists bool
	if err := tx.QueryRow(ctx,
		`SELECT EXISTS (
		   SELECT 1 FROM product
		    WHERE lower(name) = lower($1)
		      AND category = $2::product_category_enum
		      AND unit IS NOT DISTINCT FROM $3::product_unit_enum)`,
		p.Name, category, p.Unit).Scan(&exists); err != nil {
		return domain.Product{}, fmt.Errorf("check duplicate product: %w", err)
	}
	if exists {
		return domain.Product{}, &apierror.ConflictError{Msg: "a product with this name, class and unit already exists"}
	}

	var created domain.Product
	var storedCategory string
	err = tx.QueryRow(ctx,
		`INSERT INTO product (id, created_on, updated_on, created_by, updated_by, name, category, unit, description)
		 VALUES (uuidv7(), now(), now(), $1, $1, $2, $3::product_category_enum, $4::product_unit_enum, $5)
		 RETURNING id, name, category, is_active, created_on, updated_on`,
		actor, p.Name, category, p.Unit, p.Description,
	).Scan(&created.ID, &created.Name, &storedCategory, &created.Active, &created.CreatedOn, &created.UpdatedOn)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.Product{}, &apierror.ConflictError{Msg: "a product with this name, class and unit already exists"}
		}
		return domain.Product{}, fmt.Errorf("insert product: %w", err)
	}
	created.Class = domain.ProductClass(strings.ToLower(storedCategory))

	if err := tx.Commit(ctx); err != nil {
		return domain.Product{}, fmt.Errorf("commit create product: %w", err)
	}
	return created, nil
}

// SetProductActive implements ProductRepository.
func (r *productRepo) SetProductActive(ctx context.Context, id string, active bool, actor string) (domain.Product, error) {
	var p domain.Product
	var category string
	err := r.db.QueryRow(ctx,
		`UPDATE product SET is_active = $2, updated_on = now(), updated_by = $3
		  WHERE id = $1
		  RETURNING id, name, category, is_active, created_on, updated_on`,
		id, active, actor).Scan(&p.ID, &p.Name, &category, &p.Active, &p.CreatedOn, &p.UpdatedOn)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Product{}, &apierror.NotFoundError{Msg: "product not found"}
	}
	if err != nil {
		return domain.Product{}, fmt.Errorf("set product active: %w", err)
	}
	p.Class = domain.ProductClass(strings.ToLower(category))
	return p, nil
}
