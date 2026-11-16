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
	"time"
	"unicode/utf8"

	"github.com/wso2-open-operations/cs-tools/entity-service/internal/apierror"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/domain"
	"github.com/wso2-open-operations/cs-tools/entity-service/internal/repository"
)

// maxDeploymentProfileLen matches product_version.deployment_profile's VARCHAR(255).
const (
	maxDeploymentProfileLen = 255
	maxProductVersionLen    = 20 // product_version.version is VARCHAR(20)
	productVersionDateForm  = "2006-01-02"
)

var validSupportStatus = map[domain.SupportStatus]bool{
	domain.SupportStatusAvailable:    true,
	domain.SupportStatusExtended:     true,
	domain.SupportStatusDeprecated:   true,
	domain.SupportStatusDiscontinued: true,
}

type productVersionService struct {
	repo repository.ProductVersionRepository
}

// NewProductVersionService constructs a ProductVersionService backed by the given repository.
func NewProductVersionService(repo repository.ProductVersionRepository) ProductVersionService {
	return &productVersionService{repo: repo}
}

// SearchProductVersions implements ProductVersionService.
func (s *productVersionService) SearchProductVersions(ctx context.Context, req domain.SearchProductVersionsRequest) (domain.SearchProductVersionsResponse, error) {
	if err := normalizePagination(&req.Pagination); err != nil {
		return domain.SearchProductVersionsResponse{}, err
	}
	if err := validateSearchQuery(req.SearchQuery); err != nil {
		return domain.SearchProductVersionsResponse{}, err
	}
	if req.DeploymentProfile != nil && utf8.RuneCountInString(*req.DeploymentProfile) > maxDeploymentProfileLen {
		return domain.SearchProductVersionsResponse{}, &apierror.ValidationError{Msg: "deploymentProfile cannot exceed 255 characters"}
	}

	versions, total, err := s.repo.SearchProductVersions(ctx, req)
	if err != nil {
		return domain.SearchProductVersionsResponse{}, err
	}

	return domain.SearchProductVersionsResponse{
		ProductVersions: versions,
		Total:           total,
		Limit:           req.Pagination.Limit,
		Offset:          req.Pagination.Offset,
		HasMore:         req.Pagination.Offset+len(versions) < total,
	}, nil
}

func validateVersionString(v string) (string, error) {
	v = strings.TrimSpace(v)
	if v == "" {
		return "", &apierror.ValidationError{Msg: "version is required"}
	}
	if utf8.RuneCountInString(v) > maxProductVersionLen {
		return "", &apierror.ValidationError{Msg: "version cannot exceed 20 characters"}
	}
	return v, nil
}

func validateDeploymentProfile(v *string) (*string, error) {
	v = optionalText(v)
	if v != nil && utf8.RuneCountInString(*v) > maxDeploymentProfileLen {
		return nil, &apierror.ValidationError{Msg: "deploymentProfile cannot exceed 255 characters"}
	}
	return v, nil
}

func parseSupportStatus(v string) (domain.SupportStatus, error) {
	st := domain.SupportStatus(strings.ToLower(strings.TrimSpace(v)))
	if !validSupportStatus[st] {
		return "", &apierror.ValidationError{Msg: "currentSupportStatus must be one of: available, extended, deprecated, discontinued"}
	}
	return st, nil
}

// parseVersionDate reads a "YYYY-MM-DD" date; an empty value is nil.
func parseVersionDate(field string, v *string) (*time.Time, error) {
	v = optionalText(v)
	if v == nil {
		return nil, nil
	}
	t, err := time.Parse(productVersionDateForm, *v)
	if err != nil {
		return nil, &apierror.ValidationError{Msg: field + " must be a date in YYYY-MM-DD format"}
	}
	return &t, nil
}

// patchVersionDate is parseVersionDate for a PATCH field: omitted leaves the
// column alone, an empty string clears it.
func patchVersionDate(field string, v *string) (domain.FieldPatch[time.Time], error) {
	if v == nil {
		return domain.FieldPatch[time.Time]{}, nil
	}
	t, err := parseVersionDate(field, v)
	return domain.FieldPatch[time.Time]{Set: true, Value: t}, err
}

// CreateProductVersion implements ProductVersionService.
func (s *productVersionService) CreateProductVersion(ctx context.Context, productID string, req domain.CreateProductVersionRequest) (domain.ProductVersion, error) {
	if err := validateUUIDs("productId", []string{productID}); err != nil {
		return domain.ProductVersion{}, err
	}
	version, err := validateVersionString(req.Version)
	if err != nil {
		return domain.ProductVersion{}, err
	}
	profile, err := validateDeploymentProfile(req.DeploymentProfile)
	if err != nil {
		return domain.ProductVersion{}, err
	}
	status := domain.SupportStatusAvailable
	if req.CurrentSupportStatus != nil {
		if status, err = parseSupportStatus(*req.CurrentSupportStatus); err != nil {
			return domain.ProductVersion{}, err
		}
	}
	nv := domain.NewProductVersion{Version: version, DeploymentProfile: profile, CurrentSupportStatus: status}
	if nv.ReleaseDate, err = parseVersionDate("releaseDate", req.ReleaseDate); err != nil {
		return domain.ProductVersion{}, err
	}
	if nv.SupportEOLDate, err = parseVersionDate("supportEolDate", req.SupportEOLDate); err != nil {
		return domain.ProductVersion{}, err
	}
	if nv.EarliestPossibleSupportEOLDate, err = parseVersionDate("earliestPossibleSupportEolDate", req.EarliestPossibleSupportEOLDate); err != nil {
		return domain.ProductVersion{}, err
	}
	return s.repo.CreateProductVersion(ctx, productID, nv, writeActor(ctx))
}

// UpdateProductVersion implements ProductVersionService.
func (s *productVersionService) UpdateProductVersion(ctx context.Context, productID, versionID string, req domain.UpdateProductVersionRequest) (domain.ProductVersion, error) {
	if err := validateUUIDs("id", []string{productID, versionID}); err != nil {
		return domain.ProductVersion{}, err
	}
	if req == (domain.UpdateProductVersionRequest{}) {
		return domain.ProductVersion{}, &apierror.ValidationError{Msg: "no fields to update"}
	}
	patch := domain.ProductVersionPatch{Active: req.Active}
	var err error
	if req.Version != nil {
		v, err := validateVersionString(*req.Version)
		if err != nil {
			return domain.ProductVersion{}, err
		}
		patch.Version = &v
	}
	if req.DeploymentProfile != nil {
		profile, err := validateDeploymentProfile(req.DeploymentProfile)
		if err != nil {
			return domain.ProductVersion{}, err
		}
		patch.DeploymentProfile = domain.FieldPatch[string]{Set: true, Value: profile}
	}
	if req.CurrentSupportStatus != nil {
		st, err := parseSupportStatus(*req.CurrentSupportStatus)
		if err != nil {
			return domain.ProductVersion{}, err
		}
		patch.CurrentSupportStatus = &st
	}
	if patch.ReleaseDate, err = patchVersionDate("releaseDate", req.ReleaseDate); err != nil {
		return domain.ProductVersion{}, err
	}
	if patch.SupportEOLDate, err = patchVersionDate("supportEolDate", req.SupportEOLDate); err != nil {
		return domain.ProductVersion{}, err
	}
	if patch.EarliestPossibleSupportEOLDate, err = patchVersionDate("earliestPossibleSupportEolDate", req.EarliestPossibleSupportEOLDate); err != nil {
		return domain.ProductVersion{}, err
	}
	return s.repo.UpdateProductVersion(ctx, productID, versionID, patch, writeActor(ctx))
}
