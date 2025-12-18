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
import { Avatar } from "@mui/material";
import type { ProfileProps } from "./types";

const Profile: React.FC<ProfileProps> = ({
  initials,
  onClick,
  profilePictureUrl,
}) => {
  return (
    <Avatar
      onClick={onClick}
      src={profilePictureUrl}
      sx={{
        width: 36,
        height: 36,
        background: profilePictureUrl
          ? "transparent"
          : (theme) =>
              `linear-gradient(to bottom right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
        fontSize: "0.875rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: (theme) =>
            `0 0 0 2px white, 0 0 0 4px ${theme.palette.primary.dark}`,
        },
      }}
    >
      {!profilePictureUrl && initials}
    </Avatar>
  );
};

export default Profile;
