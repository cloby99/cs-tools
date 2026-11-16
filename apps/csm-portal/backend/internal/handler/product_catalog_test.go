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

package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/wso2-open-operations/cs-tools/apps/csm-portal/backend/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/apps/csm-portal/backend/internal/middleware"
)

const (
	catalogProductID = "3f1e8d6a-3b4c-4d5e-8f90-123456789abc"
	catalogVersionID = "4a2f9e7b-4c5d-4e6f-9a01-23456789abcd"
)

type fakeCatalogEntity struct {
	searchBody  []byte
	versionBody []byte
	createBody  []byte
	patchID     string
	versionIDs  [2]string
	err         error
}

func (f *fakeCatalogEntity) GetProductRepoMapping(context.Context, string) ([]byte, error) {
	return []byte(`{}`), f.err
}

func (f *fakeCatalogEntity) SearchProducts(_ context.Context, body []byte) ([]byte, error) {
	f.searchBody = body
	return []byte(`{"products":[]}`), f.err
}

func (f *fakeCatalogEntity) SearchProductVersions(_ context.Context, _ string, body []byte) ([]byte, error) {
	f.versionBody = body
	return []byte(`{"productVersions":[]}`), f.err
}

func (f *fakeCatalogEntity) CreateProduct(_ context.Context, body []byte) ([]byte, error) {
	f.createBody = body
	return []byte(`{"id":"p"}`), f.err
}

func (f *fakeCatalogEntity) SetProductActive(_ context.Context, id string, _ []byte) ([]byte, error) {
	f.patchID = id
	return []byte(`{"id":"p"}`), f.err
}

func (f *fakeCatalogEntity) CreateProductVersion(_ context.Context, id string, _ []byte) ([]byte, error) {
	f.versionIDs[0] = id
	return []byte(`{"id":"v"}`), f.err
}

func (f *fakeCatalogEntity) UpdateProductVersion(_ context.Context, id, versionID string, _ []byte) ([]byte, error) {
	f.versionIDs = [2]string{id, versionID}
	return []byte(`{"id":"v"}`), f.err
}

func catalogRequest(method, path, body string, signedIn bool) *http.Request {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if signedIn {
		req = req.WithContext(middleware.WithUserInfo(req.Context(), &middleware.UserInfo{UserID: "user"}))
	}
	return req
}

func TestSetIncludeInactive(t *testing.T) {
	has := func(b []byte) (bool, bool) {
		var m map[string]any
		if err := json.Unmarshal(b, &m); err != nil {
			t.Fatalf("not json: %s", b)
		}
		for k, v := range m {
			if strings.EqualFold(k, "includeInactive") {
				return true, v == true
			}
		}
		return false, false
	}
	for name, tc := range map[string]struct {
		in      string
		include bool
		present bool
	}{
		"added for admin":           {`{"searchQuery":"a"}`, true, true},
		"overridden for admin":      {`{"includeInactive":false}`, true, true},
		"stripped for picker":       {`{"includeInactive":true,"searchQuery":"a"}`, false, false},
		"stripped in any spelling":  {`{"INCLUDEINACTIVE":true}`, false, false},
		"admin duplicate spellings": {`{"includeinactive":false,"IncludeInactive":false}`, true, true},
	} {
		t.Run(name, func(t *testing.T) {
			out := setIncludeInactive([]byte(tc.in), tc.include)
			present, val := has(out)
			if present != tc.present || (tc.present && !val) {
				t.Errorf("out = %s, want present=%v true", out, tc.present)
			}
		})
	}
	if got := string(setIncludeInactive([]byte(`[1]`), true)); got != `[1]` {
		t.Errorf("a non-object body must pass through, got %s", got)
	}
}

func TestProductCatalog_AdminSearchIncludesRetired(t *testing.T) {
	f := &fakeCatalogEntity{}
	h := NewProductCatalogHandler(f)
	rec := httptest.NewRecorder()
	h.SearchProducts(rec, catalogRequest(http.MethodPost, "/product-catalog/products/search", `{"searchQuery":"x"}`, true))
	if rec.Code != http.StatusOK || !strings.Contains(string(f.searchBody), `"includeInactive":true`) {
		t.Fatalf("status=%d body forwarded=%s", rec.Code, f.searchBody)
	}
	rec = httptest.NewRecorder()
	h.SearchProductVersions(rec, catalogRequest(http.MethodPost, "/x", `{}`, true).WithContext(context.Background()))
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("no user = %d, want 401", rec.Code)
	}
}

func TestProductCatalog_PickerSearchNeverShowsRetired(t *testing.T) {
	f := &fakeCatalogEntity{}
	h := NewProductHandler(f)
	rec := httptest.NewRecorder()
	h.SearchProducts(rec, catalogRequest(http.MethodPost, "/products/search", `{"includeInactive":true,"searchQuery":"x"}`, true))
	if rec.Code != http.StatusOK || strings.Contains(strings.ToLower(string(f.searchBody)), "includeinactive") {
		t.Fatalf("status=%d forwarded=%s: a viewer must not be able to list retired products", rec.Code, f.searchBody)
	}
}

func TestProductCatalog_RejectsBadIDsAndBodies(t *testing.T) {
	f := &fakeCatalogEntity{}
	h := NewProductCatalogHandler(f)
	for name, tc := range map[string]struct {
		call func(http.ResponseWriter, *http.Request)
		req  *http.Request
	}{
		"patch bad id":    {h.SetProductActive, catalogRequest(http.MethodPatch, "/x", `{"active":false}`, true)},
		"versions bad id": {h.CreateProductVersion, catalogRequest(http.MethodPost, "/x", `{"version":"1"}`, true)},
		"update bad ids":  {h.UpdateProductVersion, catalogRequest(http.MethodPatch, "/x", `{"active":false}`, true)},
		"create not json": {h.CreateProduct, catalogRequest(http.MethodPost, "/x", `{nope`, true)},
	} {
		t.Run(name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			tc.call(rec, tc.req) // no path values set: ids are empty
			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want 400", rec.Code)
			}
		})
	}
	if f.createBody != nil || f.patchID != "" {
		t.Error("entity was called for an invalid request")
	}
}

func TestProductCatalog_PassesIDsAndSurfacesConflict(t *testing.T) {
	f := &fakeCatalogEntity{}
	h := NewProductCatalogHandler(f)

	req := catalogRequest(http.MethodPatch, "/x", `{"active":false}`, true)
	req.SetPathValue("id", catalogProductID)
	req.SetPathValue("versionId", catalogVersionID)
	rec := httptest.NewRecorder()
	h.UpdateProductVersion(rec, req)
	if rec.Code != http.StatusOK || f.versionIDs != [2]string{catalogProductID, catalogVersionID} {
		t.Fatalf("status=%d ids=%v", rec.Code, f.versionIDs)
	}

	// A duplicate is something the admin can act on, so its reason is shown.
	f.err = &apierror.Error{StatusCode: http.StatusConflict, Body: `{"code":409,"message":"a product with this name, class and unit already exists"}`}
	rec = httptest.NewRecorder()
	h.CreateProduct(rec, catalogRequest(http.MethodPost, "/x", `{"name":"A","class":"software"}`, true))
	if rec.Code != http.StatusConflict || !strings.Contains(rec.Body.String(), "already exists") {
		t.Fatalf("conflict = %d %s", rec.Code, rec.Body.String())
	}
}
