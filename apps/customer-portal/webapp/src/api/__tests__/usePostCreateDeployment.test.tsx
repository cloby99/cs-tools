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

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePostCreateDeployment } from "@api/usePostCreateDeployment";

// Mock providers and hooks
vi.mock("@asgardeo/react", () => ({
  useAsgardeo: () => ({
    getIdToken: vi.fn().mockResolvedValue("mock-token"),
    isSignedIn: true,
    isLoading: false,
  }),
}));

vi.mock("@context/AuthApiContext", () => ({
  useAuthApiClient: () =>
    vi.fn().mockImplementation((url, init) => fetch(url, init)),
}));

const mockUseMockConfig = vi.fn().mockReturnValue({
  isMockEnabled: false,
});

vi.mock("@/providers/MockConfigProvider", () => ({
  useMockConfig: () => mockUseMockConfig(),
}));

vi.mock("@/hooks/useLogger", () => ({
  useLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("usePostCreateDeployment", () => {
  const projectId = "proj-123";
  const requestBody = {
    deploymentTypeKey: 4,
    description: "test description",
    name: "test deployment",
  };

  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
    vi.stubGlobal("config", {
      CUSTOMER_PORTAL_BACKEND_BASE_URL: "https://api.example.com",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create a deployment successfully", async () => {
    const mockResponse = {
      createdBy: "user1",
      createdOn: "2026-02-17",
      id: "dep-123",
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue(mockResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => usePostCreateDeployment(projectId), {
      wrapper,
    });

    result.current.mutate(requestBody);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/projects/${projectId}/deployments`),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(requestBody),
      }),
    );
  });

  it("should handle error during deployment creation", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: vi.fn().mockResolvedValue("Error message"),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => usePostCreateDeployment(projectId), {
      wrapper,
    });

    result.current.mutate(requestBody);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Internal Server Error");
  });

  it("should throw error when mock is enabled", async () => {
    mockUseMockConfig.mockReturnValue({ isMockEnabled: true });

    const { result } = renderHook(() => usePostCreateDeployment(projectId), {
      wrapper,
    });

    result.current.mutate(requestBody);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain(
      "Creating a deployment is not available when mock is enabled.",
    );
  });
});
