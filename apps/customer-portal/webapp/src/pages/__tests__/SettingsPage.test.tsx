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
// software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider, createTheme } from "@wso2/oxygen-ui";
import SettingsPage from "@pages/SettingsPage";

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={createTheme({})}>{ui}</ThemeProvider>);
}

describe("SettingsPage", () => {
  it("renders page title and subtitle", () => {
    renderWithTheme(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(
      screen.getByText("Manage AI support capabilities and preferences"),
    ).toBeInTheDocument();
  });

  it("renders AI-Powered Support Assistant header", () => {
    renderWithTheme(<SettingsPage />);
    expect(
      screen.getByText("AI-Powered Support Assistant"),
    ).toBeInTheDocument();
  });

  it("renders Support Capabilities section", () => {
    renderWithTheme(<SettingsPage />);
    expect(screen.getByText("Support Capabilities")).toBeInTheDocument();
  });

  it("renders Novera chat toggle", () => {
    renderWithTheme(<SettingsPage />);
    expect(screen.getByText("AI Chat Assistant (Novera)")).toBeInTheDocument();
  });

  it("renders Smart Knowledge Base toggle", () => {
    renderWithTheme(<SettingsPage />);
    expect(
      screen.getByText("Smart Knowledge Base Suggestions"),
    ).toBeInTheDocument();
  });

  it("renders AI Best Practices section", () => {
    renderWithTheme(<SettingsPage />);
    expect(screen.getByText("AI Best Practices")).toBeInTheDocument();
  });
});
