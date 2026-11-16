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
	"strings"

	"github.com/wso2-open-operations/cs-tools/apps/csm-portal/backend/internal/middleware"
)

// entityProductCatalogClient is the entity-service surface the admin product
// catalog screen uses. The searches are the same calls the pickers make.
type entityProductCatalogClient interface {
	SearchProducts(ctx context.Context, body []byte) ([]byte, error)
	SearchProductVersions(ctx context.Context, productID string, body []byte) ([]byte, error)
	CreateProduct(ctx context.Context, body []byte) ([]byte, error)
	SetProductActive(ctx context.Context, id string, body []byte) ([]byte, error)
	CreateProductVersion(ctx context.Context, productID string, body []byte) ([]byte, error)
	UpdateProductVersion(ctx context.Context, productID, versionID string, body []byte) ([]byte, error)
}

// ProductCatalogHandler is the admin side of the product catalog (Settings >
// Products): list including retired entries, add a product or version, retire
// or restore one. Every route is registered PermAdmin; the pickers keep using
// ProductHandler and never see a retired entry.
type ProductCatalogHandler struct {
	entity entityProductCatalogClient
}

// NewProductCatalogHandler builds the handler over the entity client.
func NewProductCatalogHandler(entity entityProductCatalogClient) *ProductCatalogHandler {
	return &ProductCatalogHandler{entity: entity}
}

const includeInactiveKey = "includeInactive"

// setIncludeInactive rewrites a search body so retired rows are returned (true)
// or can never be asked for (false: the key is removed). Keys are matched
// case-insensitively because the entity service's decoder is, so a body
// spelling it "INCLUDEINACTIVE" cannot slip past the strip. A body that is not
// a JSON object is returned as it is for the upstream to refuse.
func setIncludeInactive(body []byte, include bool) []byte {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(body, &fields); err != nil || fields == nil {
		return body
	}
	found := false
	for k := range fields {
		if strings.EqualFold(k, includeInactiveKey) {
			delete(fields, k)
			found = true
		}
	}
	if !include && !found {
		return body // nothing to strip: forward the caller's bytes untouched
	}
	if include {
		fields[includeInactiveKey] = json.RawMessage("true")
	}
	out, err := json.Marshal(fields)
	if err != nil {
		return body
	}
	return out
}

// requireCatalogCaller answers 401 when there is no signed-in user.
func requireCatalogCaller(w http.ResponseWriter, r *http.Request) bool {
	if middleware.UserInfoFromContext(r.Context()) == nil {
		writeError(w, http.StatusUnauthorized, ErrMsgUnauthorized)
		return false
	}
	return true
}

// SearchProducts handles POST /product-catalog/products/search: the normal
// product search with retired products included.
func (h *ProductCatalogHandler) SearchProducts(w http.ResponseWriter, r *http.Request) {
	if !requireCatalogCaller(w, r) {
		return
	}
	body, ok := readAndValidateJSONBody(w, r)
	if !ok {
		return
	}
	result, err := h.entity.SearchProducts(r.Context(), setIncludeInactive(body, true))
	if err != nil {
		mapUpstreamErrorGeneric(w, err, "Failed to load products.")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// CreateProduct handles POST /product-catalog/products.
func (h *ProductCatalogHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	if !requireCatalogCaller(w, r) {
		return
	}
	body, ok := readAndValidateJSONBody(w, r)
	if !ok {
		return
	}
	result, err := h.entity.CreateProduct(r.Context(), body)
	if err != nil {
		mapUpstreamError(w, err, "Failed to add the product.")
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

// SetProductActive handles PATCH /product-catalog/products/{id}.
func (h *ProductCatalogHandler) SetProductActive(w http.ResponseWriter, r *http.Request) {
	if !requireCatalogCaller(w, r) {
		return
	}
	id := r.PathValue("id")
	if !uuidRe.MatchString(id) {
		writeError(w, http.StatusBadRequest, ErrMsgInvalidUUID)
		return
	}
	body, ok := readAndValidateJSONBody(w, r)
	if !ok {
		return
	}
	result, err := h.entity.SetProductActive(r.Context(), id, body)
	if err != nil {
		mapUpstreamError(w, err, "Failed to update the product.")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// SearchProductVersions handles POST /product-catalog/products/{id}/versions/search.
func (h *ProductCatalogHandler) SearchProductVersions(w http.ResponseWriter, r *http.Request) {
	if !requireCatalogCaller(w, r) {
		return
	}
	id := r.PathValue("id")
	if !uuidRe.MatchString(id) {
		writeError(w, http.StatusBadRequest, ErrMsgInvalidUUID)
		return
	}
	body, ok := readAndValidateJSONBody(w, r)
	if !ok {
		return
	}
	result, err := h.entity.SearchProductVersions(r.Context(), id, setIncludeInactive(body, true))
	if err != nil {
		mapUpstreamErrorGeneric(w, err, "Failed to load product versions.")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// CreateProductVersion handles POST /product-catalog/products/{id}/versions.
func (h *ProductCatalogHandler) CreateProductVersion(w http.ResponseWriter, r *http.Request) {
	if !requireCatalogCaller(w, r) {
		return
	}
	id := r.PathValue("id")
	if !uuidRe.MatchString(id) {
		writeError(w, http.StatusBadRequest, ErrMsgInvalidUUID)
		return
	}
	body, ok := readAndValidateJSONBody(w, r)
	if !ok {
		return
	}
	result, err := h.entity.CreateProductVersion(r.Context(), id, body)
	if err != nil {
		mapUpstreamError(w, err, "Failed to add the version.")
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

// UpdateProductVersion handles PATCH /product-catalog/products/{id}/versions/{versionId}.
func (h *ProductCatalogHandler) UpdateProductVersion(w http.ResponseWriter, r *http.Request) {
	if !requireCatalogCaller(w, r) {
		return
	}
	id, versionID := r.PathValue("id"), r.PathValue("versionId")
	if !uuidRe.MatchString(id) || !uuidRe.MatchString(versionID) {
		writeError(w, http.StatusBadRequest, ErrMsgInvalidUUID)
		return
	}
	body, ok := readAndValidateJSONBody(w, r)
	if !ok {
		return
	}
	result, err := h.entity.UpdateProductVersion(r.Context(), id, versionID, body)
	if err != nil {
		mapUpstreamError(w, err, "Failed to update the version.")
		return
	}
	writeJSON(w, http.StatusOK, result)
}
