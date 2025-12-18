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

import { Box, Button } from "@mui/material";
import { Group as UsersIcon } from "@mui/icons-material";
import type { CommunityProps } from "./types";

const Community: React.FC<CommunityProps> = ({ label, onClick }) => {
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Button
        disableRipple
        onClick={onClick}
        sx={{
          color: "text.primary",
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
          gap: 1,
          height: 36,
          px: 1.5,
          border: (theme) => `1px solid ${theme.palette.grey[200]}`,
          borderRadius: "6px",
          backgroundColor: "background.paper",
          transition: "background-color 0.2s, border-color 0.2s",
          "&:hover": {
            backgroundColor: (theme) => theme.palette.grey[100],
            borderColor: (theme) => theme.palette.grey[300],
          },
        }}
      >
        <UsersIcon sx={{ width: 16, height: 16 }} />
        {label}
      </Button>
    </Box>
  );
};

export default Community;
