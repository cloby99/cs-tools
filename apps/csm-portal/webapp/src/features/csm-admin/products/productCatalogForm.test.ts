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

import { describe, expect, it } from "vitest";
import {
  EMPTY_PRODUCT_DRAFT,
  EMPTY_VERSION_DRAFT,
  buildCreateProduct,
  buildCreateVersion,
  buildVersionPatch,
  productDraftError,
  toDateInput,
  toSupportStatus,
  versionDraftError,
  versionDraftFrom,
  type StoredVersion,
} from "@features/csm-admin/products/productCatalogForm";

const stored: StoredVersion = {
  version: "4.4.0",
  deploymentProfile: "Split",
  currentSupportStatus: "AVAILABLE",
  releaseDate: "2025-03-11T00:00:00Z",
  supportEolDate: null,
  earliestPossibleSupportEolDate: null,
};

describe("productCatalogForm", () => {
  it("reads dates and the status the way the API sends them", () => {
    expect(toDateInput("2025-03-11T00:00:00Z")).toBe("2025-03-11");
    expect(toDateInput(null)).toBe("");
    expect(toSupportStatus("DEPRECATED")).toBe("deprecated");
    expect(toSupportStatus(null)).toBe("available");
    expect(toSupportStatus("nonsense")).toBe("available");
  });

  it("builds a product body without empty optional fields", () => {
    expect(buildCreateProduct({ ...EMPTY_PRODUCT_DRAFT, name: "  Gateway ", description: "  " })).toEqual({
      name: "Gateway",
      class: "software",
    });
    expect(buildCreateProduct({ name: "X", productClass: "service", unit: "APIM", description: " d " })).toEqual({
      name: "X",
      class: "service",
      unit: "APIM",
      description: "d",
    });
  });

  it("validates product and version drafts", () => {
    expect(productDraftError(EMPTY_PRODUCT_DRAFT)).toMatch(/name/);
    expect(productDraftError({ ...EMPTY_PRODUCT_DRAFT, name: "a".repeat(101) })).toMatch(/100/);
    expect(productDraftError({ ...EMPTY_PRODUCT_DRAFT, name: "ok" })).toBeNull();
    expect(versionDraftError(EMPTY_VERSION_DRAFT)).toMatch(/version/i);
    expect(versionDraftError({ ...EMPTY_VERSION_DRAFT, version: "1".repeat(21) })).toMatch(/20/);
    expect(versionDraftError({ ...EMPTY_VERSION_DRAFT, version: "1.0" })).toBeNull();
  });

  it("builds a version body with only the filled fields", () => {
    expect(buildCreateVersion({ ...EMPTY_VERSION_DRAFT, version: " 1.0 ", releaseDate: "2025-01-02" })).toEqual({
      version: "1.0",
      currentSupportStatus: "available",
      releaseDate: "2025-01-02",
    });
  });

  it("patches only what changed, and an emptied field is sent as an empty string", () => {
    const draft = versionDraftFrom(stored);
    expect(buildVersionPatch(stored, draft)).toEqual({});
    expect(buildVersionPatch(stored, { ...draft, status: "deprecated", supportEolDate: "2027-01-31" })).toEqual({
      currentSupportStatus: "deprecated",
      supportEolDate: "2027-01-31",
    });
    expect(buildVersionPatch(stored, { ...draft, releaseDate: "", deploymentProfile: " " })).toEqual({
      releaseDate: "",
      deploymentProfile: "",
    });
  });
});
