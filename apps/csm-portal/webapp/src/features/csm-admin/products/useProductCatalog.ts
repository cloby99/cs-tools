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

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useBackendApi } from "@api/backend/client";
import { BE_MAX_PAGE_LIMIT } from "@constants/apiConstants";
import type {
  CreateProductBody,
  CreateVersionBody,
  ProductClass,
  VersionPatchBody,
} from "@features/csm-admin/products/productCatalogForm";

export interface CatalogProduct {
  id: string;
  name: string;
  class: ProductClass;
  /** false once an admin has retired the product (soft delete). */
  active: boolean;
  createdOn: string;
  updatedOn: string;
}

export interface CatalogVersion {
  id: string;
  productId: string;
  version: string;
  currentSupportStatus: string | null;
  releaseDate: string | null;
  supportEolDate: string | null;
  earliestPossibleSupportEolDate: string | null;
  deploymentProfile: string | null;
  active: boolean;
}

const CATALOG_KEY = ["admin", "product-catalog"] as const;

interface Page<T> {
  items: T[];
  hasMore: boolean;
}

/** Reads every page: the catalog is small, and the screen shows it whole. */
async function readAll<T>(fetchPage: (offset: number) => Promise<Page<T>>): Promise<T[]> {
  const all: T[] = [];
  for (let offset = 0; ; offset += BE_MAX_PAGE_LIMIT) {
    const page = await fetchPage(offset);
    all.push(...page.items);
    if (!page.hasMore || page.items.length === 0) return all;
  }
}

/** Every product, retired ones included. */
export function useCatalogProducts(): UseQueryResult<CatalogProduct[], Error> {
  const api = useBackendApi();
  return useQuery<CatalogProduct[], Error>({
    queryKey: [...CATALOG_KEY, "products"],
    queryFn: () =>
      readAll<CatalogProduct>(async (offset) => {
        const res = await api.post<
          { pagination: { limit: number; offset: number } },
          { products?: CatalogProduct[]; hasMore?: boolean }
        >("/product-catalog/products/search", { pagination: { limit: BE_MAX_PAGE_LIMIT, offset } });
        return { items: res?.products ?? [], hasMore: res?.hasMore ?? false };
      }),
  });
}

/** Every version of a product, retired ones included. Idle until a product is chosen. */
export function useCatalogVersions(productId: string | null): UseQueryResult<CatalogVersion[], Error> {
  const api = useBackendApi();
  return useQuery<CatalogVersion[], Error>({
    queryKey: [...CATALOG_KEY, "versions", productId],
    enabled: productId !== null,
    queryFn: () =>
      readAll<CatalogVersion>(async (offset) => {
        const res = await api.post<
          { pagination: { limit: number; offset: number } },
          { productVersions?: CatalogVersion[]; hasMore?: boolean }
        >(`/product-catalog/products/${encodeURIComponent(productId ?? "")}/versions/search`, {
          pagination: { limit: BE_MAX_PAGE_LIMIT, offset },
        });
        return { items: res?.productVersions ?? [], hasMore: res?.hasMore ?? false };
      }),
  });
}

function useCatalogMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
): UseMutationResult<TResult, Error, TVars> {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TVars>({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: CATALOG_KEY });
    },
  });
}

export function useCreateProduct(): UseMutationResult<CatalogProduct, Error, CreateProductBody> {
  const api = useBackendApi();
  return useCatalogMutation((body) => api.post<CreateProductBody, CatalogProduct>("/product-catalog/products", body));
}

export function useSetProductActive(): UseMutationResult<CatalogProduct, Error, { id: string; active: boolean }> {
  const api = useBackendApi();
  return useCatalogMutation(({ id, active }) =>
    api.patch<{ active: boolean }, CatalogProduct>(`/product-catalog/products/${encodeURIComponent(id)}`, { active }),
  );
}

export function useCreateVersion(): UseMutationResult<
  CatalogVersion,
  Error,
  { productId: string; body: CreateVersionBody }
> {
  const api = useBackendApi();
  return useCatalogMutation(({ productId, body }) =>
    api.post<CreateVersionBody, CatalogVersion>(
      `/product-catalog/products/${encodeURIComponent(productId)}/versions`,
      body,
    ),
  );
}

export function useUpdateVersion(): UseMutationResult<
  CatalogVersion,
  Error,
  { productId: string; versionId: string; body: VersionPatchBody | { active: boolean } }
> {
  const api = useBackendApi();
  return useCatalogMutation(({ productId, versionId, body }) =>
    api.patch<VersionPatchBody | { active: boolean }, CatalogVersion>(
      `/product-catalog/products/${encodeURIComponent(productId)}/versions/${encodeURIComponent(versionId)}`,
      body,
    ),
  );
}
