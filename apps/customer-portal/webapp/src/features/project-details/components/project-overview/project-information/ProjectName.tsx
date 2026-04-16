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

import { Box, Chip, Skeleton, Typography } from "@wso2/oxygen-ui";
import type { JSX } from "react";

export interface ProjectNameProps {
  name: string;
  projectKey: string;
  isLoading?: boolean;
}

/**
 * Project display name and key chips.
 *
 * @param props - Name, key, loading.
 * @returns {JSX.Element} Label row.
 */
export default function ProjectName({
  name,
  projectKey,
  isLoading,
}: ProjectNameProps): JSX.Element {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body2"
        fontWeight="medium"
        sx={{ display: "block", mb: 1 }}
      >
        Project Name
      </Typography>
      {isLoading ? (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Skeleton variant="rounded" width={160} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="body1" component="span">
            {name || "--"}
          </Typography>
          <Chip label={projectKey || "--"} size="small" variant="outlined" />
        </Box>
      )}
    </Box>
  );
}
