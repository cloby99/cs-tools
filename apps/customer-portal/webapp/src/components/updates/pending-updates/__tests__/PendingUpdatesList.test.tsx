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
import { describe, it, expect } from "vitest";
import { PendingUpdatesList } from "@components/updates/pending-updates/PendingUpdatesList";
import type { RecommendedUpdateLevelItem } from "@models/responses";

const mockRecommended: RecommendedUpdateLevelItem = {
  productName: "wso2am",
  productBaseVersion: "4.2.0",
  channel: "full",
  startingUpdateLevel: 0,
  endingUpdateLevel: 11,
  installedUpdatesCount: 46,
  installedSecurityUpdatesCount: 3,
  timestamp: 0,
  recommendedUpdateLevel: 22,
  availableUpdatesCount: 44,
  availableSecurityUpdatesCount: 9,
};

const mockPendingRows = [
  { updateLevel: 12, updateType: "regular" as const },
  { updateLevel: 13, updateType: "security" as const },
  { updateLevel: 14, updateType: "security" as const },
];

describe("PendingUpdatesList", () => {
  it("renders empty state when pendingRows is empty", () => {
    render(
      <PendingUpdatesList pendingRows={[]} recommendedItem={mockRecommended} />,
    );
    expect(
      screen.getByText("No pending updates found for this product and version."),
    ).toBeDefined();
  });

  it("renders summary when recommendedItem is provided", () => {
    render(
      <PendingUpdatesList
        pendingRows={mockPendingRows}
        recommendedItem={mockRecommended}
      />,
    );
    expect(screen.getByText(/There are .* 3 .* updates/)).toBeDefined();
  });

  it("renders table with Update Level, Update Type, Details columns", () => {
    render(
      <PendingUpdatesList
        pendingRows={mockPendingRows}
        recommendedItem={mockRecommended}
      />,
    );
    expect(screen.getByText("Update Level")).toBeDefined();
    expect(screen.getByText("Update Type")).toBeDefined();
    expect(screen.getByText("Details")).toBeDefined();
  });

  it("renders each pending row with level and type badge", () => {
    render(
      <PendingUpdatesList
        pendingRows={mockPendingRows}
        recommendedItem={mockRecommended}
      />,
    );
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("13")).toBeDefined();
    expect(screen.getByText("14")).toBeDefined();
    expect(screen.getAllByText("Security").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Regular").length).toBeGreaterThan(0);
    expect(screen.getAllByText("View").length).toBe(3);
  });
});
