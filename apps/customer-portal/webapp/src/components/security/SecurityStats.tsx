// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { type JSX } from "react";
import { Grid, Box } from "@wso2/oxygen-ui";
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Package,
} from "@wso2/oxygen-ui-icons-react";
import GenericSubCountCard from "@components/common/GenericSubCountCard";
import ErrorIndicator from "@components/common/error-indicator/ErrorIndicator";

export interface SecurityStatsProps {
  totalRecords?: number;
  isError?: boolean;
  isLoading?: boolean;
}

/**
 * Security stats cards displaying Total Vulnerabilities, Unresolved Issues,
 * Security Advisories, and Vulnerable Components.
 * @returns {JSX.Element}
 */
const SecurityStats = ({
  totalRecords,
  isError,
}: SecurityStatsProps): JSX.Element => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <GenericSubCountCard
          label="Total Vulnerabilities"
          value={
            isError ? (
              <ErrorIndicator entityName="vulnerabilities" size="medium" />
            ) : totalRecords !== undefined ? (
              totalRecords
            ) : (
              "—"
            )
          }
          icon={<ShieldAlert size={32} />}
          color="error.main"
          footerContent={
            !isError && (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box component="span" sx={{ color: "error.main" }}>
                  — Critical
                </Box>
                <Box component="span" sx={{ color: "warning.main" }}>
                  — High
                </Box>
              </Box>
            )
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <GenericSubCountCard
          label="Unresolved Issues"
          value={isError ? "—" : "—"}
          icon={<AlertTriangle size={32} />}
          color="warning.main"
          footerContent={
            <Box sx={{ color: "text.secondary" }}>Requires attention</Box>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <GenericSubCountCard
          label="Security Advisories"
          value={isError ? "—" : "—"}
          icon={<FileText size={32} />}
          color="info.main"
          footerContent={
            <Box component="span" sx={{ color: "text.secondary" }}>
              —
            </Box>
          }
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <GenericSubCountCard
          label="Vulnerable Components"
          value={isError ? "—" : "—"}
          icon={<Package size={32} />}
          color="text.primary"
          footerContent={
            <Box sx={{ color: "text.secondary" }}>
              Components with known issues
            </Box>
          }
        />
      </Grid>
    </Grid>
  );
};

export default SecurityStats;
