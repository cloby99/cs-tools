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

import { IconButton, Badge } from "@mui/material";
import { NotificationsOutlined as BellIcon } from "@mui/icons-material";
import type { AnnouncementsProps } from "./types";

const Announcements: React.FC<AnnouncementsProps> = ({ count, onClick }) => {
  return (
    <IconButton
      disableRipple
      onClick={onClick}
      sx={{
        width: 36,
        height: 36,
        borderRadius: "6px",
        color: "text.primary",
        transition: "background-color 0.2s",
        "&:hover": { backgroundColor: (theme) => theme.palette.grey[100] },
      }}
    >
      <Badge
        variant="dot"
        invisible={count === 0}
        sx={{
          "& .MuiBadge-badge": {
            backgroundColor: (theme) => theme.palette.primary.dark,
            width: 8,
            height: 8,
            borderRadius: "50%",
            top: 4,
            right: 4,
          },
        }}
      >
        <BellIcon sx={{ width: 20, height: 20 }} />
      </Badge>
    </IconButton>
  );
};

export default Announcements;
