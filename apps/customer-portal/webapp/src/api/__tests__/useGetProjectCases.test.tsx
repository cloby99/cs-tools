import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import useGetProjectCases from "../useGetProjectCases";
import type { JSX } from "react";

// Mock @asgardeo/react
vi.mock("@asgardeo/react", () => ({
  useAsgardeo: () => ({
    isSignedIn: true,
    isLoading: false,
    getIdToken: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

// Mock MockConfigProvider
vi.mock("@/providers/MockConfigProvider", () => ({
  useMockConfig: () => ({
    isMockEnabled: true,
  }),
}));

// Mock logger
vi.mock("@/utils/logger", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useLogger hook
vi.mock("@/hooks/useLogger", () => ({
  useLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("useGetProjectCases", () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: React.ReactNode }) => JSX.Element;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    vi.clearAllMocks();
  });

  it("should have correct query options", () => {
    const requestBody = { page: 1, limit: 10 };
    renderHook(() => useGetProjectCases("project-1", requestBody), {
      wrapper,
    });

    const query = queryClient.getQueryCache().findAll({
      queryKey: ["project-cases", "project-1", requestBody, true],
    })[0];

    expect((query?.options as any).staleTime).toBeUndefined();
    expect((query?.options as any).refetchOnWindowFocus).toBeUndefined();
  });

  it("should not fetch if projectId is missing", () => {
    const { result } = renderHook(
      () => useGetProjectCases("", { page: 1, limit: 10 }),
      {
        wrapper,
      },
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
  });
});
