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

export type ProductClass = "software" | "service";
export type SupportStatus = "available" | "extended" | "deprecated" | "discontinued";

export const PRODUCT_CLASS_LABEL: Record<ProductClass, string> = {
  software: "Software",
  service: "Service",
};

export const SUPPORT_STATUS_OPTIONS: { value: SupportStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "extended", label: "Extended" },
  { value: "deprecated", label: "Deprecated" },
  { value: "discontinued", label: "Discontinued" },
];

/** product_unit_enum's labels, as entity-service accepts them. */
export const PRODUCT_UNIT_OPTIONS = [
  "INTEGRATION",
  "IOT",
  "IAM",
  "CHOREO",
  "ASGARDEO",
  "APIM",
  "ANALYTICS",
  "DEVANT",
  "BIJIRA",
] as const;

export const MAX_PRODUCT_NAME_LENGTH = 100;
export const MAX_PRODUCT_DESCRIPTION_LENGTH = 1000;
export const MAX_VERSION_LENGTH = 20;
export const MAX_DEPLOYMENT_PROFILE_LENGTH = 255;

export interface ProductDraft {
  name: string;
  productClass: ProductClass;
  unit: string;
  description: string;
}

export interface VersionDraft {
  version: string;
  deploymentProfile: string;
  status: SupportStatus;
  releaseDate: string;
  supportEolDate: string;
  earliestPossibleSupportEolDate: string;
}

/** The fields of a stored version a draft is built from; dates are as the API sends them. */
export interface StoredVersion {
  version: string;
  deploymentProfile: string | null;
  currentSupportStatus: string | null;
  releaseDate: string | null;
  supportEolDate: string | null;
  earliestPossibleSupportEolDate: string | null;
}

export const EMPTY_PRODUCT_DRAFT: ProductDraft = { name: "", productClass: "software", unit: "", description: "" };

export const EMPTY_VERSION_DRAFT: VersionDraft = {
  version: "",
  deploymentProfile: "",
  status: "available",
  releaseDate: "",
  supportEolDate: "",
  earliestPossibleSupportEolDate: "",
};

/** The API sends dates as timestamps ("2025-03-11T00:00:00Z"); a date input wants "2025-03-11". */
export function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : "";
}

/** Entity-service returns the status in the database's case; the form works in lower case. */
export function toSupportStatus(value: string | null | undefined): SupportStatus {
  const lower = (value ?? "").toLowerCase();
  return SUPPORT_STATUS_OPTIONS.some((option) => option.value === lower) ? (lower as SupportStatus) : "available";
}

export function versionDraftFrom(stored: StoredVersion): VersionDraft {
  return {
    version: stored.version,
    deploymentProfile: stored.deploymentProfile ?? "",
    status: toSupportStatus(stored.currentSupportStatus),
    releaseDate: toDateInput(stored.releaseDate),
    supportEolDate: toDateInput(stored.supportEolDate),
    earliestPossibleSupportEolDate: toDateInput(stored.earliestPossibleSupportEolDate),
  };
}

/** The first problem with a product draft, or null when it can be saved. */
export function productDraftError(draft: ProductDraft): string | null {
  const name = draft.name.trim();
  if (!name) return "Enter a product name.";
  if (name.length > MAX_PRODUCT_NAME_LENGTH) return `The name can be at most ${MAX_PRODUCT_NAME_LENGTH} characters.`;
  if (draft.description.trim().length > MAX_PRODUCT_DESCRIPTION_LENGTH) {
    return `The description can be at most ${MAX_PRODUCT_DESCRIPTION_LENGTH} characters.`;
  }
  return null;
}

/** The first problem with a version draft, or null when it can be saved. */
export function versionDraftError(draft: VersionDraft): string | null {
  const version = draft.version.trim();
  if (!version) return "Enter a version.";
  if (version.length > MAX_VERSION_LENGTH) return `The version can be at most ${MAX_VERSION_LENGTH} characters.`;
  if (draft.deploymentProfile.trim().length > MAX_DEPLOYMENT_PROFILE_LENGTH) {
    return `The deployment profile can be at most ${MAX_DEPLOYMENT_PROFILE_LENGTH} characters.`;
  }
  return null;
}

export interface CreateProductBody {
  name: string;
  class: ProductClass;
  unit?: string;
  description?: string;
}

export function buildCreateProduct(draft: ProductDraft): CreateProductBody {
  const body: CreateProductBody = { name: draft.name.trim(), class: draft.productClass };
  if (draft.unit) body.unit = draft.unit;
  const description = draft.description.trim();
  if (description) body.description = description;
  return body;
}

export interface CreateVersionBody {
  version: string;
  deploymentProfile?: string;
  currentSupportStatus: SupportStatus;
  releaseDate?: string;
  supportEolDate?: string;
  earliestPossibleSupportEolDate?: string;
}

export function buildCreateVersion(draft: VersionDraft): CreateVersionBody {
  const body: CreateVersionBody = { version: draft.version.trim(), currentSupportStatus: draft.status };
  const profile = draft.deploymentProfile.trim();
  if (profile) body.deploymentProfile = profile;
  if (draft.releaseDate) body.releaseDate = draft.releaseDate;
  if (draft.supportEolDate) body.supportEolDate = draft.supportEolDate;
  if (draft.earliestPossibleSupportEolDate) body.earliestPossibleSupportEolDate = draft.earliestPossibleSupportEolDate;
  return body;
}

/** An empty string clears a nullable field on the server; an omitted field is left alone. */
export type VersionPatchBody = Partial<{
  version: string;
  deploymentProfile: string;
  currentSupportStatus: SupportStatus;
  releaseDate: string;
  supportEolDate: string;
  earliestPossibleSupportEolDate: string;
}>;

/** Only what the admin changed, so a save never rewrites a field they did not touch. */
export function buildVersionPatch(original: StoredVersion, draft: VersionDraft): VersionPatchBody {
  const before = versionDraftFrom(original);
  const patch: VersionPatchBody = {};
  if (draft.version.trim() !== before.version) patch.version = draft.version.trim();
  if (draft.deploymentProfile.trim() !== before.deploymentProfile) patch.deploymentProfile = draft.deploymentProfile.trim();
  if (draft.status !== before.status) patch.currentSupportStatus = draft.status;
  if (draft.releaseDate !== before.releaseDate) patch.releaseDate = draft.releaseDate;
  if (draft.supportEolDate !== before.supportEolDate) patch.supportEolDate = draft.supportEolDate;
  if (draft.earliestPossibleSupportEolDate !== before.earliestPossibleSupportEolDate) {
    patch.earliestPossibleSupportEolDate = draft.earliestPossibleSupportEolDate;
  }
  return patch;
}
