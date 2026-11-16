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

package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/auth"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
)

const (
	pwProductID = "3f1e8d6a-3b4c-4d5e-8f90-123456789abc"
	pwVersionID = "4a2f9e7b-4c5d-4e6f-9a01-23456789abcd"
)

func pwPtr[T any](v T) *T { return &v }

func pwIsValidation(err error) bool {
	var ve *apierror.ValidationError
	return errors.As(err, &ve)
}

func TestProductService_CreateProduct_Normalizes(t *testing.T) {
	repo := &fakeProductRepo{}
	ctx := auth.WithIdentity(context.Background(), auth.Identity{UserEmail: "admin@example.com"})
	_, err := NewProductService(repo).CreateProduct(ctx, domain.CreateProductRequest{
		Name: "  Gateway  ", Class: " Software ", Unit: pwPtr(" apim "), Description: pwPtr("   "),
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	got := repo.created
	if got == nil || got.Name != "Gateway" || got.Class != domain.ProductClassSoftware {
		t.Fatalf("name/class not normalized: %+v", got)
	}
	if got.Unit == nil || *got.Unit != "APIM" {
		t.Errorf("unit = %v, want APIM", got.Unit)
	}
	if got.Description != nil {
		t.Errorf("blank description should be nil, got %q", *got.Description)
	}
	if repo.actor != "admin@example.com" {
		t.Errorf("actor = %q, want the caller's email", repo.actor)
	}
}

func TestProductService_CreateProduct_ActorFallsBackToClientID(t *testing.T) {
	repo := &fakeProductRepo{}
	ctx := auth.WithIdentity(context.Background(), auth.Identity{ClientID: "csm-portal-backend"})
	if _, err := NewProductService(repo).CreateProduct(ctx, domain.CreateProductRequest{Name: "X", Class: "service"}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.actor != "csm-portal-backend" {
		t.Errorf("actor = %q, want the client id", repo.actor)
	}
}

func TestProductService_CreateProduct_Rejects(t *testing.T) {
	for name, req := range map[string]domain.CreateProductRequest{
		"blank name":    {Name: "  ", Class: "software"},
		"long name":     {Name: strings.Repeat("a", 101), Class: "software"},
		"no class":      {Name: "X"},
		"unknown class": {Name: "X", Class: "product_model"},
		"unknown unit":  {Name: "X", Class: "software", Unit: pwPtr("nope")},
		"long text":     {Name: "X", Class: "software", Description: pwPtr(strings.Repeat("a", 1001))},
	} {
		t.Run(name, func(t *testing.T) {
			repo := &fakeProductRepo{}
			_, err := NewProductService(repo).CreateProduct(context.Background(), req)
			if !pwIsValidation(err) {
				t.Fatalf("err = %v, want ValidationError", err)
			}
			if repo.created != nil {
				t.Error("repository was reached for an invalid request")
			}
		})
	}
}

func TestProductVersionService_Create_DefaultsAndParses(t *testing.T) {
	repo := &stubProductVersionRepo{}
	_, err := NewProductVersionService(repo).CreateProductVersion(context.Background(), pwProductID, domain.CreateProductVersionRequest{
		Version: " 4.4.0 ", DeploymentProfile: pwPtr("  "), ReleaseDate: pwPtr("2025-03-11"), SupportEOLDate: pwPtr(""),
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	got := repo.created
	if got.Version != "4.4.0" || got.CurrentSupportStatus != domain.SupportStatusAvailable {
		t.Errorf("version/status = %q/%q", got.Version, got.CurrentSupportStatus)
	}
	if got.DeploymentProfile != nil || got.SupportEOLDate != nil {
		t.Error("blank profile and blank date should be nil")
	}
	if got.ReleaseDate == nil || got.ReleaseDate.Format("2006-01-02") != "2025-03-11" {
		t.Errorf("releaseDate = %v", got.ReleaseDate)
	}
}

func TestProductVersionService_Create_Rejects(t *testing.T) {
	for name, tc := range map[string]struct {
		productID string
		req       domain.CreateProductVersionRequest
	}{
		"bad product id": {"nope", domain.CreateProductVersionRequest{Version: "1"}},
		"blank version":  {pwProductID, domain.CreateProductVersionRequest{Version: " "}},
		"long version":   {pwProductID, domain.CreateProductVersionRequest{Version: strings.Repeat("1", 21)}},
		"long profile":   {pwProductID, domain.CreateProductVersionRequest{Version: "1", DeploymentProfile: pwPtr(strings.Repeat("a", 256))}},
		"bad status":     {pwProductID, domain.CreateProductVersionRequest{Version: "1", CurrentSupportStatus: pwPtr("retired")}},
		"bad date":       {pwProductID, domain.CreateProductVersionRequest{Version: "1", ReleaseDate: pwPtr("11/03/2025")}},
		"bad eol date":   {pwProductID, domain.CreateProductVersionRequest{Version: "1", SupportEOLDate: pwPtr("2025-13-01")}},
	} {
		t.Run(name, func(t *testing.T) {
			repo := &stubProductVersionRepo{}
			_, err := NewProductVersionService(repo).CreateProductVersion(context.Background(), tc.productID, tc.req)
			if !pwIsValidation(err) {
				t.Fatalf("err = %v, want ValidationError", err)
			}
			if repo.created != nil {
				t.Error("repository was reached for an invalid request")
			}
		})
	}
}

func TestProductVersionService_Update_OmittedLeftAloneEmptyClears(t *testing.T) {
	repo := &stubProductVersionRepo{}
	_, err := NewProductVersionService(repo).UpdateProductVersion(context.Background(), pwProductID, pwVersionID,
		domain.UpdateProductVersionRequest{
			CurrentSupportStatus: pwPtr("Deprecated"),
			SupportEOLDate:       pwPtr("2027-01-31"),
			ReleaseDate:          pwPtr(""),
			DeploymentProfile:    pwPtr(""),
		})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	p := repo.patched
	if p.Version != nil {
		t.Error("omitted version must stay nil")
	}
	if p.CurrentSupportStatus == nil || *p.CurrentSupportStatus != domain.SupportStatusDeprecated {
		t.Errorf("status = %v", p.CurrentSupportStatus)
	}
	if !p.SupportEOLDate.Set || p.SupportEOLDate.Value == nil {
		t.Error("supportEolDate should be set to a value")
	}
	if !p.ReleaseDate.Set || p.ReleaseDate.Value != nil {
		t.Error("empty releaseDate should be a set-to-NULL")
	}
	if !p.DeploymentProfile.Set || p.DeploymentProfile.Value != nil {
		t.Error("empty deploymentProfile should be a set-to-NULL")
	}
	if p.EarliestPossibleSupportEOLDate.Set {
		t.Error("omitted date must not be set")
	}
}

func TestProductVersionService_Update_Rejects(t *testing.T) {
	for name, tc := range map[string]struct {
		versionID string
		req       domain.UpdateProductVersionRequest
	}{
		"no fields":      {pwVersionID, domain.UpdateProductVersionRequest{}},
		"bad version id": {"nope", domain.UpdateProductVersionRequest{Version: pwPtr("1")}},
		"blank version":  {pwVersionID, domain.UpdateProductVersionRequest{Version: pwPtr("")}},
		"bad status":     {pwVersionID, domain.UpdateProductVersionRequest{CurrentSupportStatus: pwPtr("")}},
		"bad date":       {pwVersionID, domain.UpdateProductVersionRequest{ReleaseDate: pwPtr("soon")}},
	} {
		t.Run(name, func(t *testing.T) {
			repo := &stubProductVersionRepo{}
			_, err := NewProductVersionService(repo).UpdateProductVersion(context.Background(), pwProductID, tc.versionID, tc.req)
			if !pwIsValidation(err) {
				t.Fatalf("err = %v, want ValidationError", err)
			}
			if repo.patched != nil {
				t.Error("repository was reached for an invalid request")
			}
		})
	}
}
