// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

export interface IncidentCount {
  s0: number;
  s1: number;
  s2: number;
  s3: number;
  s4: number;
}

export interface ActiveCaseCount {
  awaitingCount: number;
  waitingOnWSO2Count: number;
  workInProgressCount: number;
}

export interface ProjectStatistics {
  openCasesCount: number;
  activeChatsCount: number;
  deploymentsCount: number;
  totalCasesCount: number;
  inProgressCasesCount: number;
  "-": number;
  resolvedCasesCount: number;
  currentMonthResolvedCasesCount: number;
  avgResponseTime: string;
  incidentCount: IncidentCount;
  activeCaseCount: ActiveCaseCount;
}

export interface RecentActivity {
  totalTimeLogged: number;
  billableHours: number;
  lastDeployment: string;
  systemHealth: string;
}

export interface ProjectMetadataResponse {
  projectStatistics: ProjectStatistics;
  recentActivity: RecentActivity;
}
