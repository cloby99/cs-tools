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

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DetailRow from "@case-details/DetailRow";
import { ThemeProvider, createTheme } from "@wso2/oxygen-ui";

vi.mock("@/components/common/error-indicator/ErrorIndicator", () => ({
  default: ({ entityName }: { entityName: string }) => (
    <span data-testid="error-indicator">{entityName}</span>
  ),
}));

vi.mock("@utils/support", () => ({
  formatValue: (v: unknown) => (v == null || v === "" ? "--" : String(v)),
}));

function renderDetailRow(props: {
  label: string;
  value?: string | null;
  isLoading?: boolean;
  isError?: boolean;
}) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <DetailRow
        label={props.label}
        value={props.value}
        isLoading={props.isLoading ?? false}
        isError={props.isError ?? false}
      />
    </ThemeProvider>,
  );
}

describe("DetailRow", () => {
  it("should render label and value when not loading and not error", () => {
    renderDetailRow({ label: "Product", value: "Choreo" });
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Choreo")).toBeInTheDocument();
  });

  it("should render -- for null value", () => {
    renderDetailRow({ label: "Account", value: null });
    expect(screen.getByText("--")).toBeInTheDocument();
  });

  it("should render error indicator when isError is true", () => {
    renderDetailRow({ label: "Description", value: "Text", isError: true });
    expect(screen.getByTestId("error-indicator")).toBeInTheDocument();
  });

  it("should not show value when isLoading is true", () => {
    renderDetailRow({ label: "Created", value: "2026-01-01", isLoading: true });
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.queryByText("2026-01-01")).not.toBeInTheDocument();
  });
});
