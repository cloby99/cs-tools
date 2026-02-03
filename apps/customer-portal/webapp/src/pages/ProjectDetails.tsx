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

import { Box, Typography } from "@wso2/oxygen-ui";
import { useParams } from "react-router";
import { useState, type JSX } from "react";
import TabBar from "@/components/common/tabBar/TabBar";
import { PROJECT_DETAILS_TABS } from "@/constants/projectDetailsConstants";

/**
 * ProjectDetails component.
 *
 * @returns {JSX.Element} The ProjectDetails component.
 */
export default function ProjectDetails(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Overview (Coming Soon)
            </Typography>
          </Box>
        );
      case "deployments":
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Deployments (Coming Soon)
            </Typography>
          </Box>
        );
      case "time-tracking":
        return (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Time Tracking (Coming Soon)
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* project page tabs */}
      <TabBar
        tabs={PROJECT_DETAILS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* project page content */}
      <Box sx={{ flex: 1, mt: 2 }}>{renderContent()}</Box>
    </Box>
  );
}
