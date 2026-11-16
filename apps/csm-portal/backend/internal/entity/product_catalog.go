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

package entity

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
)

// CreateProduct calls POST /products on the entity service.
func (c *CustomerEntityClient) CreateProduct(ctx context.Context, body []byte) ([]byte, error) {
	return c.do(ctx, http.MethodPost, "/products", body)
}

// SetProductActive calls PATCH /products/{id} on the entity service (retire or
// restore a product).
func (c *CustomerEntityClient) SetProductActive(ctx context.Context, id string, body []byte) ([]byte, error) {
	return c.do(ctx, http.MethodPatch, fmt.Sprintf("/products/%s", url.PathEscape(id)), body)
}

// CreateProductVersion calls POST /products/{id}/versions on the entity service.
func (c *CustomerEntityClient) CreateProductVersion(ctx context.Context, productID string, body []byte) ([]byte, error) {
	return c.do(ctx, http.MethodPost, fmt.Sprintf("/products/%s/versions", url.PathEscape(productID)), body)
}

// UpdateProductVersion calls PATCH /products/{id}/versions/{versionId} on the
// entity service.
func (c *CustomerEntityClient) UpdateProductVersion(ctx context.Context, productID, versionID string, body []byte) ([]byte, error) {
	return c.do(ctx, http.MethodPatch, fmt.Sprintf("/products/%s/versions/%s", url.PathEscape(productID), url.PathEscape(versionID)), body)
}
