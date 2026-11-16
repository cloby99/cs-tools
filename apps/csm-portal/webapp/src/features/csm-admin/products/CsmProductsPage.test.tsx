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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import CsmProductsPage from "@features/csm-admin/products/CsmProductsPage";

const api = vi.hoisted(() => ({
  products: [] as Array<Record<string, unknown>>,
  versions: [] as Array<Record<string, unknown>>,
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("@api/backend/client", () => ({
  useBackendApi: () => ({ post: api.post, patch: api.patch }),
}));

const PRODUCT_ID = "3f1e8d6a-3b4c-4d5e-8f90-123456789abc";

function product(over: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: PRODUCT_ID, name: "Gateway", class: "software", active: true, createdOn: "", updatedOn: "", ...over };
}

function renderPage(): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <CsmProductsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.products = [];
  api.versions = [];
  api.post.mockReset();
  api.patch.mockReset();
  api.post.mockImplementation(async (url: string) => {
    if (url.endsWith("/versions/search")) return { productVersions: api.versions, hasMore: false };
    if (url === "/product-catalog/products/search") return { products: api.products, hasMore: false };
    return {};
  });
  api.patch.mockResolvedValue({});
});

describe("CsmProductsPage", () => {
  it("hides retired products until asked, and marks them", async () => {
    api.products = [product(), product({ id: "other", name: "Old Tool", active: false })];
    renderPage();
    expect(await screen.findByText("Gateway")).toBeInTheDocument();
    expect(screen.queryByText("Old Tool")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Show retired"));
    expect(screen.getByText("Old Tool")).toBeInTheDocument();
    expect(screen.getByText("Retired")).toBeInTheDocument();
  });

  it("retires a product only after confirmation, with a soft-delete patch", async () => {
    api.products = [product()];
    renderPage();
    await screen.findByText("Gateway");

    fireEvent.click(screen.getByRole("button", { name: "Retire" }));
    expect(api.patch).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Retire" }));

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(`/product-catalog/products/${PRODUCT_ID}`, { active: false }),
    );
  });

  it("restores a retired product", async () => {
    api.products = [product({ active: false })];
    renderPage();
    fireEvent.click(await screen.findByLabelText("Show retired"));
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Restore" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(`/product-catalog/products/${PRODUCT_ID}`, { active: true }),
    );
  });

  it("adds a product and shows the server's reason when it already exists", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Add product" }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: "Add product" }));
    expect(api.post).not.toHaveBeenCalledWith("/product-catalog/products", expect.anything());
    expect(within(dialog).getByText("Enter a product name.")).toBeInTheDocument();

    api.post.mockRejectedValueOnce(new Error("a product with this name, class and unit already exists"));
    fireEvent.change(within(dialog).getByLabelText(/Name/), { target: { value: "  Gateway " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Add product" }));
    expect(await within(dialog).findByText(/already exists/)).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/product-catalog/products", { name: "Gateway", class: "software" });
  });

  it("lists a software product's versions and offers none for a service", async () => {
    api.products = [product(), product({ id: "svc", name: "Cloud Thing", class: "service" })];
    api.versions = [
      {
        id: "v1",
        productId: PRODUCT_ID,
        version: "4.4.0",
        currentSupportStatus: "AVAILABLE",
        releaseDate: "2025-03-11T00:00:00Z",
        supportEolDate: null,
        earliestPossibleSupportEolDate: null,
        deploymentProfile: null,
        active: true,
      },
    ];
    renderPage();
    await screen.findByText("Gateway");
    expect(screen.getAllByRole("button", { name: "Versions" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Versions" }));
    const table = await screen.findByRole("table", { name: "Versions of Gateway" });
    expect(within(table).getByText("4.4.0")).toBeInTheDocument();
    expect(within(table).getByText("2025-03-11")).toBeInTheDocument();
    expect(within(table).getByText("Available")).toBeInTheDocument();
  });

  it("sends only the changed fields when a version is edited", async () => {
    api.products = [product()];
    api.versions = [
      {
        id: "v1",
        productId: PRODUCT_ID,
        version: "4.4.0",
        currentSupportStatus: "AVAILABLE",
        releaseDate: "2025-03-11T00:00:00Z",
        supportEolDate: null,
        earliestPossibleSupportEolDate: null,
        deploymentProfile: null,
        active: true,
      },
    ];
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Versions" }));
    const table = await screen.findByRole("table", { name: "Versions of Gateway" });
    fireEvent.click(within(table).getByRole("button", { name: "Edit" }));
    const dialog = await screen.findByRole("dialog");

    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText("Support end date"), { target: { value: "2027-01-31" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith(`/product-catalog/products/${PRODUCT_ID}/versions/v1`, {
        supportEolDate: "2027-01-31",
      }),
    );
  });
});
