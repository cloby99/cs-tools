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

// Package service is declared in interfaces.go.
package service

import (
	"context"
	"strings"
	"unicode/utf8"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/auth"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/repository"
)

// validProductClass enumerates the class values the products table accepts.
// Unlike the ServiceNow-backed search, an empty Class here means "no
// filter" — the products table already stores one row per distinct
// product, so there is no version-duplication problem to default around.
var validProductClass = map[domain.ProductClass]bool{
	domain.ProductClassSoftware: true,
	domain.ProductClassService:  true,
}

type productService struct {
	repo repository.ProductRepository
}

// NewProductService constructs a ProductService backed by the given repository.
func NewProductService(repo repository.ProductRepository) ProductService {
	return &productService{repo: repo}
}

// SearchProducts implements ProductService.
func (s *productService) SearchProducts(ctx context.Context, req domain.SearchProductsRequest) (domain.SearchProductsResponse, error) {
	if err := normalizePagination(&req.Pagination); err != nil {
		return domain.SearchProductsResponse{}, err
	}
	if err := validateSearchQuery(req.SearchQuery); err != nil {
		return domain.SearchProductsResponse{}, err
	}
	if req.Class != "" && !validProductClass[domain.ProductClass(req.Class)] {
		return domain.SearchProductsResponse{}, &apierror.ValidationError{Msg: "invalid class"}
	}

	products, total, err := s.repo.SearchProducts(ctx, req)
	if err != nil {
		return domain.SearchProductsResponse{}, err
	}

	return domain.SearchProductsResponse{
		Products: products,
		Total:    total,
		Limit:    req.Pagination.Limit,
		Offset:   req.Pagination.Offset,
		HasMore:  req.Pagination.Offset+len(products) < total,
	}, nil
}

const (
	maxProductNameLen        = 100 // product.name is VARCHAR(100)
	maxProductDescriptionLen = 1000
)

// validProductUnit lists product_unit_enum's labels; keep it in step with the
// enum (migrations 0015 and 0113).
var validProductUnit = map[string]bool{
	"INTEGRATION": true, "IOT": true, "IAM": true, "CHOREO": true, "ASGARDEO": true,
	"APIM": true, "ANALYTICS": true, "DEVANT": true, "BIJIRA": true,
}

// writeActor is what created_by/updated_by records for an admin write: the
// signed-in user's email, else the calling service's client id.
func writeActor(ctx context.Context) string {
	id := auth.IdentityFromContext(ctx)
	switch {
	case id.UserEmail != "":
		return id.UserEmail
	case id.ClientID != "":
		return id.ClientID
	default:
		return "entity-service"
	}
}

// optionalText trims v and returns nil when nothing is left.
func optionalText(v *string) *string {
	if v == nil {
		return nil
	}
	t := strings.TrimSpace(*v)
	if t == "" {
		return nil
	}
	return &t
}

// CreateProduct implements ProductService.
func (s *productService) CreateProduct(ctx context.Context, req domain.CreateProductRequest) (domain.Product, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return domain.Product{}, &apierror.ValidationError{Msg: "name is required"}
	}
	if utf8.RuneCountInString(name) > maxProductNameLen {
		return domain.Product{}, &apierror.ValidationError{Msg: "name cannot exceed 100 characters"}
	}
	class := domain.ProductClass(strings.ToLower(strings.TrimSpace(req.Class)))
	if !validProductClass[class] {
		return domain.Product{}, &apierror.ValidationError{Msg: "class must be one of: software, service"}
	}
	unit := optionalText(req.Unit)
	if unit != nil {
		u := strings.ToUpper(*unit)
		if !validProductUnit[u] {
			return domain.Product{}, &apierror.ValidationError{Msg: "invalid unit"}
		}
		unit = &u
	}
	description := optionalText(req.Description)
	if description != nil && utf8.RuneCountInString(*description) > maxProductDescriptionLen {
		return domain.Product{}, &apierror.ValidationError{Msg: "description cannot exceed 1000 characters"}
	}

	return s.repo.CreateProduct(ctx, domain.NewProduct{Name: name, Class: class, Unit: unit, Description: description}, writeActor(ctx))
}
