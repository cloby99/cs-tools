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
import { describe, expect, it } from "vitest";
import type { CallRequest } from "@models/responses";
import CallRequestCard from "@case-details-calls/CallRequestCard";

const mockCall: CallRequest = {
  id: "call-1",
  case: { id: "case-1", label: "CS0438719" },
  reason: "Test notes for the call",
  preferredTimes: ["2024-10-29 14:00:00"],
  durationMin: 60,
  scheduleTime: "2024-11-05 14:00:00",
  createdOn: "2024-10-29 10:00:00",
  updatedOn: "2024-10-29 10:00:00",
  state: { id: "1", label: "Pending on WSO2" },
};

describe("CallRequestCard", () => {
  it("should render call request details correctly", () => {
    render(<CallRequestCard call={mockCall} />);

    expect(screen.getByText(/Call Request/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending on WSO2/i)).toBeInTheDocument();
    expect(screen.getByText(/Test notes for the call/i)).toBeInTheDocument();
    expect(screen.getByText(/60 minutes/i)).toBeInTheDocument();
  });

  it("should format createdOn date correctly", () => {
    render(<CallRequestCard call={mockCall} />);
    expect(screen.getByText(/Requested on Oct 29/i)).toBeInTheDocument();
  });

  it("should display '--' for missing or nullish values", () => {
    const incompleteCall = {
      id: "call-incomplete",
      case: { id: "c1", label: "CS1" },
      reason: "",
      preferredTimes: [],
      durationMin: undefined,
      scheduleTime: "",
      createdOn: "",
      updatedOn: "",
      state: { id: "1", label: "" },
    } as CallRequest;

    render(<CallRequestCard call={incompleteCall} />);

    expect(screen.getByText(/Requested on --/i)).toBeInTheDocument();
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });
});
