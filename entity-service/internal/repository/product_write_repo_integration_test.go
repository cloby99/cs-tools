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

package repository_test

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/repository"
)

// Skipped unless ENTITY_TEST_DATABASE_URL is set (a migrated Postgres 18; the
// ids come from uuidv7()). Every row it writes is created by "pw-test", which
// the cleanup deletes before and after.
//
//	ENTITY_TEST_DATABASE_URL="postgres:///entity_test" go test -v -run TestProductWrite ./internal/repository/

const pwActor = "pw-test"

func pwPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	dsn := os.Getenv("ENTITY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("ENTITY_TEST_DATABASE_URL not set")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)
	clean := func() {
		for _, q := range []string{
			`DELETE FROM product_version WHERE created_by = 'pw-test'`,
			`DELETE FROM product WHERE created_by = 'pw-test'`,
		} {
			if _, err := pool.Exec(context.Background(), q); err != nil {
				t.Fatalf("cleanup: %v", err)
			}
		}
	}
	clean()
	t.Cleanup(clean)
	return pool
}

func pwStr(s string) *string { return &s }

func pwDate(s string) *time.Time {
	d, err := time.Parse("2006-01-02", s)
	if err != nil {
		panic(err)
	}
	return &d
}

func TestProductWrite_CreateProduct(t *testing.T) {
	ctx := context.Background()
	repo := repository.NewProductRepository(pwPool(t))

	p, err := repo.CreateProduct(ctx, domain.NewProduct{Name: "PW Gateway", Class: domain.ProductClassSoftware, Unit: pwStr("APIM")}, pwActor)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if p.ID == "" || p.Name != "PW Gateway" || p.Class != domain.ProductClassSoftware {
		t.Fatalf("unexpected product: %+v", p)
	}

	// The same name in another case, class and unit is a duplicate...
	_, err = repo.CreateProduct(ctx, domain.NewProduct{Name: "pw gateway", Class: domain.ProductClassSoftware, Unit: pwStr("APIM")}, pwActor)
	var ce *apierror.ConflictError
	if !errors.As(err, &ce) {
		t.Fatalf("duplicate = %v, want ConflictError", err)
	}
	// ...a different unit or class is a different product...
	if _, err := repo.CreateProduct(ctx, domain.NewProduct{Name: "PW Gateway", Class: domain.ProductClassSoftware, Unit: pwStr("IAM")}, pwActor); err != nil {
		t.Fatalf("other unit: %v", err)
	}
	if _, err := repo.CreateProduct(ctx, domain.NewProduct{Name: "PW Gateway", Class: domain.ProductClassService, Unit: pwStr("APIM")}, pwActor); err != nil {
		t.Fatalf("other class: %v", err)
	}
	// ...and two unit-less products of one name collide even though the unique
	// key alone would let them both in (NULLs never match).
	if _, err := repo.CreateProduct(ctx, domain.NewProduct{Name: "PW Bare", Class: domain.ProductClassSoftware}, pwActor); err != nil {
		t.Fatalf("unit-less: %v", err)
	}
	if _, err := repo.CreateProduct(ctx, domain.NewProduct{Name: "PW BARE", Class: domain.ProductClassSoftware}, pwActor); !errors.As(err, &ce) {
		t.Fatalf("unit-less duplicate = %v, want ConflictError", err)
	}
}

func TestProductWrite_Versions(t *testing.T) {
	ctx := context.Background()
	pool := pwPool(t)
	products := repository.NewProductRepository(pool)
	versions := repository.NewProductVersionRepository(pool)

	sw, err := products.CreateProduct(ctx, domain.NewProduct{Name: "PW Software", Class: domain.ProductClassSoftware}, pwActor)
	if err != nil {
		t.Fatal(err)
	}
	svc, err := products.CreateProduct(ctx, domain.NewProduct{Name: "PW Service", Class: domain.ProductClassService}, pwActor)
	if err != nil {
		t.Fatal(err)
	}

	v, err := versions.CreateProductVersion(ctx, sw.ID, domain.NewProductVersion{
		Version: "4.4.0", CurrentSupportStatus: domain.SupportStatusAvailable, ReleaseDate: pwDate("2025-03-11"),
	}, pwActor)
	if err != nil {
		t.Fatalf("create version: %v", err)
	}
	if v.ProductID != sw.ID || v.ReleaseDate == nil || v.DeploymentProfile != nil || v.CurrentSupportStatus == nil {
		t.Fatalf("unexpected version: %+v", v)
	}

	var ce *apierror.ConflictError
	var ve *apierror.ValidationError
	var nf *apierror.NotFoundError

	// Same string and (absent) profile is a duplicate, in either case.
	if _, err := versions.CreateProductVersion(ctx, sw.ID, domain.NewProductVersion{Version: "4.4.0", CurrentSupportStatus: domain.SupportStatusAvailable}, pwActor); !errors.As(err, &ce) {
		t.Fatalf("duplicate = %v, want ConflictError", err)
	}
	// A different profile is a different version.
	other, err := versions.CreateProductVersion(ctx, sw.ID, domain.NewProductVersion{Version: "4.4.0", DeploymentProfile: pwStr("Split"), CurrentSupportStatus: domain.SupportStatusAvailable}, pwActor)
	if err != nil {
		t.Fatalf("other profile: %v", err)
	}
	// A service has no versions; an unknown product is a 404.
	if _, err := versions.CreateProductVersion(ctx, svc.ID, domain.NewProductVersion{Version: "1", CurrentSupportStatus: domain.SupportStatusAvailable}, pwActor); !errors.As(err, &ve) {
		t.Fatalf("service product = %v, want ValidationError", err)
	}
	if _, err := versions.CreateProductVersion(ctx, "00000000-0000-4000-8000-000000000000", domain.NewProductVersion{Version: "1", CurrentSupportStatus: domain.SupportStatusAvailable}, pwActor); !errors.As(err, &nf) {
		t.Fatalf("unknown product = %v, want NotFoundError", err)
	}

	// Patch: named fields change, the rest stay; an empty date clears.
	status := domain.SupportStatusDeprecated
	got, err := versions.UpdateProductVersion(ctx, sw.ID, v.ID, domain.ProductVersionPatch{
		CurrentSupportStatus: &status,
		SupportEOLDate:       domain.FieldPatch[time.Time]{Set: true, Value: pwDate("2027-01-31")},
		ReleaseDate:          domain.FieldPatch[time.Time]{Set: true},
	}, pwActor)
	if err != nil {
		t.Fatalf("patch: %v", err)
	}
	if got.CurrentSupportStatus == nil || string(*got.CurrentSupportStatus) != "DEPRECATED" && string(*got.CurrentSupportStatus) != "deprecated" {
		t.Errorf("status = %v", got.CurrentSupportStatus)
	}
	if got.SupportEOLDate == nil || got.ReleaseDate != nil || got.Version != "4.4.0" {
		t.Errorf("patch result: %+v", got)
	}

	// Renaming onto another version of the same product conflicts; the version
	// string is untouched.
	rename := "4.4.0"
	if _, err := versions.UpdateProductVersion(ctx, sw.ID, other.ID, domain.ProductVersionPatch{
		DeploymentProfile: domain.FieldPatch[string]{Set: true}, Version: &rename,
	}, pwActor); !errors.As(err, &ce) {
		t.Fatalf("rename onto duplicate = %v, want ConflictError", err)
	}
	// A version addressed through the wrong product is a 404.
	if _, err := versions.UpdateProductVersion(ctx, svc.ID, v.ID, domain.ProductVersionPatch{Version: &rename}, pwActor); !errors.As(err, &nf) {
		t.Fatalf("wrong product = %v, want NotFoundError", err)
	}
	// Saving a version without changing its identity is not a conflict with itself.
	if _, err := versions.UpdateProductVersion(ctx, sw.ID, v.ID, domain.ProductVersionPatch{Version: &rename}, pwActor); err != nil {
		t.Fatalf("self rename: %v", err)
	}
}
