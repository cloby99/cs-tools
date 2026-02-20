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
  Clock,
  AlertCircle,
  CheckCircle,
  Activity,
} from "@wso2/oxygen-ui-icons-react";
import { type DashboardMockStats } from "@models/responses";
import { colors } from "@wso2/oxygen-ui";

// Valid color types for the stat card icons.
export type StatCardColor =
  | "primary"
  | "secondary"
  | "error"
  | "warning"
  | "info"
  | "success";

// Configuration for a single statistic card.
export interface StatConfigItem {
  id: Exclude<keyof DashboardMockStats, "casesTrend">;
  label: string;
  icon: any;
  iconColor: StatCardColor;
  tooltipText: string;
}

// Dashboard statistics list.
export const DASHBOARD_STATS: StatConfigItem[] = [
  {
    id: "totalCases",
    label: "Total Engagements",
    icon: Clock,
    iconColor: "primary",
    tooltipText: "Total number of cases reported for this project",
  },
  {
    id: "openCases",
    label: "Active Engagements",
    icon: AlertCircle,
    iconColor: "warning",
    tooltipText: "Currently active and unresolved cases",
  },
  {
    id: "resolvedCases",
    label: "Resolved This Month",
    icon: CheckCircle,
    iconColor: "success",
    tooltipText: "Successfully closed and resolved cases",
  },
  {
    id: "avgResponseTime",
    label: "Avg. Response Time",
    icon: Activity,
    iconColor: "info",
    tooltipText: "Average time taken to first respond to a case",
  },
];

// Configuration for Active Cases Chart data mapping (stateCount labels, exclude Closed).
export const ACTIVE_CASES_CHART_DATA = [
  { name: "Open", key: "open", color: colors.blue[500] },
  { name: "Work In Progress", key: "workInProgress", color: colors.teal?.[600] ?? "#0D9488" },
  { name: "Awaiting Info", key: "awaitingInfo", color: colors.green[500] },
  { name: "Waiting On WSO2", key: "waitingOnWso2", color: colors.orange[500] },
  { name: "Solution Proposed", key: "solutionProposed", color: colors.grey?.[500] ?? "#9CA3AF" },
  { name: "Reopened", key: "reopened", color: colors.purple[500] },
] as const;

/** Maps severity API label to display name (S0-S4) for charts and table. */
export const SEVERITY_LABEL_TO_DISPLAY: Record<string, string> = {
  "Catastrophic (P0)": "S0",
  "Critical (P1)": "S1",
  "High (P2)": "S2",
  "Medium (P3)": "S3",
  "Low (P4)": "S4",
};

// Legend display format: "S{n} - {Severity}". Same order for Outstanding Engagements and Cases Trend.
// Order: S4 - Catastrophic, S3 - Medium, S2 - High, S1 - Critical, S0 - Low.
export const SEVERITY_LEGEND_ORDER = [
  { key: "catastrophic", label: "Catastrophic (P0)", displayName: "S4 - Catastrophic", color: colors.red[500] },
  { key: "critical", label: "Critical (P1)", displayName: "S1 - Critical", color: colors.orange[500] },
  { key: "high", label: "High (P2)", displayName: "S2 - High", color: colors.yellow[700] },
  { key: "medium", label: "Medium (P3)", displayName: "S3 - Medium", color: colors.blue[500] },
  { key: "low", label: "Low (P4)", displayName: "S0 - Low", color: colors.green[500] },
] as const;

export const OUTSTANDING_INCIDENTS_CHART_DATA = SEVERITY_LEGEND_ORDER;

/**
 * Type definition for Cases Trend Chart data item.
 */
export interface CasesTrendChartDataItem {
  name: string;
  key: string;
  color: string;
  radius?: [number, number, number, number];
  border?: boolean;
}

// Configuration for Cases Trend Chart (same legend order as Outstanding Engagements).
export const CASES_TREND_CHART_DATA: CasesTrendChartDataItem[] =
  SEVERITY_LEGEND_ORDER.map((item, i) => ({
    name: item.displayName,
    key: item.key,
    color: item.color,
    ...(i === 0 && { radius: [0, 0, 4, 4] as [number, number, number, number] }),
    ...(i === 4 && { radius: [4, 4, 0, 0] as [number, number, number, number], border: true }),
  }));

// Placeholder data for Cases Trend Chart when in error state.
export const TREND_CHART_ERROR_PLACEHOLDER_DATA = [
  { period: "Jan", critical: 40, high: 24, medium: 24, low: 20, catastrophic: 5 },
  { period: "Feb", critical: 30, high: 13, medium: 22, low: 30, catastrophic: 2 },
  { period: "Mar", critical: 20, high: 98, medium: 22, low: 10, catastrophic: 8 },
  { period: "Apr", critical: 27, high: 39, medium: 20, low: 40, catastrophic: 3 },
  { period: "May", critical: 18, high: 48, medium: 21, low: 50, catastrophic: 6 },
  { period: "Jun", critical: 23, high: 38, medium: 25, low: 30, catastrophic: 4 },
];
