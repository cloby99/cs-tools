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

import React, { useState } from "react";
import { Box, Menu, Typography } from "@mui/material";
import type { DropdownMenuProps } from "./types";
import ProjectSwitcher from "./ProjectSwitcher";
import ProjectList from "./ProjectList";
import Divider from "../common/Divider";
import { useProject } from "../../../context/ProjectContext";

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  currentProjectName,
  currentProjectKey,
  currentProjectId,
  onProjectChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { totalRecords } = useProject();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProjectSelect = (project: any) => {
    if (onProjectChange) {
      onProjectChange(project.sysId, project.name, project.projectKey);
    }
    handleClose();
  };

  return (
    <Box>
      {/* Project Switcher */}
      <ProjectSwitcher
        handleOpen={handleOpen}
        currentProjectName={currentProjectName}
        anchorEl={anchorEl}
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <Box sx={{ p: 1, minWidth: 300 }}>
          {/* Project Switcher Header */}
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: "grey.500",
              px: 1,
              py: 0.75,
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            SWITCH PROJECT ({totalRecords} available)
          </Typography>

          {/* Divider */}
          <Divider />

          {/* Project List */}
          <ProjectList
            currentProjectName={currentProjectName}
            currentProjectKey={currentProjectKey}
            currentProjectId={currentProjectId}
            handleProjectSelect={handleProjectSelect}
          />

          {/* Divider */}
          <Divider />

          {/* Project Switcher Footer */}
          <Box sx={{ p: 1 }}>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "grey.500",
                px: 1,
              }}
            >
              Need access to another project? Contact your administrator
            </Typography>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default DropdownMenu;
