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

import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RequestCallModal from "@case-details-calls/RequestCallModal";

vi.mock("@api/usePostCallRequest", () => ({
  usePostCallRequest: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@api/usePatchCallRequest", () => ({
  usePatchCallRequest: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderWithProviders(ui: ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("RequestCallModal", () => {
  it("should render form with Preferred Time, Meeting Duration, and Additional Notes", () => {
    renderWithProviders(
      <RequestCallModal
        open
        projectId="proj-1"
        caseId="case-1"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Preferred Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Meeting Duration/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        /Any specific topics or questions you'd like to discuss/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request Call/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

});
