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

import {
  Box,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { X } from "@wso2/oxygen-ui-icons-react";
import { type JSX } from "react";
import {
  BANNER_FOOTER_GAP_PX,
  FOOTER_HEIGHT_PX,
} from "@constants/errorBannerConstants";

interface ErrorBannerProps {
  apiName: string;
  progress: number;
  onClose: () => void;
}

/**
 * ErrorBanner component displayed above the footer at the right corner.
 * Shows a countdown progress bar and close button.
 *
 * @param {ErrorBannerProps} props - Component props.
 * @returns {JSX.Element} The ErrorBanner JSX.
 */
export default function ErrorBanner({
  apiName,
  progress,
  onClose,
}: ErrorBannerProps): JSX.Element {
  return (
    <Paper
      elevation={2}
      sx={{
        position: "fixed",
        bottom: FOOTER_HEIGHT_PX + BANNER_FOOTER_GAP_PX,
        right: 0,
        width: 400,
        zIndex: 10,
        overflow: "hidden",
        bgcolor: "error.main",
      }}
      role="alert"
    >
      <Stack spacing={0}>
        <Box sx={{ width: "100%" }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            color="warning"
            sx={{ height: 4 }}
          />
        </Box>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Typography variant="body2" sx={{ color: "error.contrastText" }}>
            Error loading {apiName}
          </Typography>
          <IconButton
            size="small"
            aria-label="Close"
            onClick={onClose}
            sx={{ flexShrink: 0, color: "error.contrastText" }}
          >
            <X size={18} />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
