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

import React from "react";
import { Box, Typography } from "@mui/material";
import { Check } from "@mui/icons-material";
import type { ProjectListProps } from "./types";
import { useProject } from "../../../context/ProjectContext";

const ProjectList: React.FC<ProjectListProps> = ({
  currentProjectName,
  currentProjectKey,
  currentProjectId,
  handleProjectSelect,
}) => {
  const { projects } = useProject();

  return (
    <Box>
      {projects.map((project) => {
        const isSelected = currentProjectId
          ? project.sysId.toString() === currentProjectId
          : project.name === currentProjectName ||
            project.projectKey === currentProjectKey;

        return (
          <Box
            key={project.sysId}
            onClick={() => handleProjectSelect(project)}
            sx={{
              width: "100%",
              textAlign: "left",
              px: 1.5,
              py: 1,
              borderRadius: "2px",
              cursor: "pointer",
              "&:hover": {
                bgcolor: "grey.50",
              },
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              {/* Project List Item Name */}
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: "grey.900",
                  flex: 1,
                }}
              >
                {project.name}
              </Typography>
              {isSelected && (
                <Check
                  sx={{
                    fontSize: "0.875rem",
                    color: "primary.main",
                  }}
                />
              )}
            </Box>
            {/* Project List Item Key */}
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: "grey.500",
                mt: 0.25,
              }}
            >
              {project.projectKey}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default ProjectList;
