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

import { Box, InputBase } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import type { SearchBarProps } from "./types";

const SearchBar: React.FC<SearchBarProps> = ({ placeholder, onChange }) => {
  return (
    <Box sx={{ flex: 1, maxWidth: 448 }}>
      <Box position="relative" display="flex" alignItems="center">
        <SearchIcon
          sx={{
            position: "absolute",
            left: 12,
            width: 16,
            height: 16,
            color: "#9ca3af",
          }}
        />

        <InputBase
          placeholder={placeholder}
          onChange={onChange}
          fullWidth
          sx={{
            "& .MuiInputBase-input": {
              pl: 4.5,
              pr: 2,
              py: 1,
              border: (theme) => `1px solid ${theme.palette.grey[200]}`,
              borderRadius: "8px",
              fontSize: "0.875rem",
              transition: "0.2s",
              "&:focus": {
                outline: "none",
                boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.dark}`,
                borderColor: (theme) => theme.palette.primary.dark,
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default SearchBar;
