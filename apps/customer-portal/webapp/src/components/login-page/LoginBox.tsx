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

import { Box, Button, Divider, Stack, Typography } from "@wso2/oxygen-ui";
import { ArrowRight } from "@wso2/oxygen-ui-icons-react";
import { useAsgardeo } from "@asgardeo/react";
import type { JSX } from "react";

export default function LoginBox(): JSX.Element {
  const { signIn } = useAsgardeo();

  const handleLogin = async () => {
    await signIn();
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h3" gutterBottom>
          Login to Account
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Ready to explore? Continue with your account to proceed.
        </Typography>
      </Box>

      <Divider />

      <Button
        fullWidth
        size="large"
        variant="contained"
        endIcon={<ArrowRight />}
        color="primary"
        onClick={handleLogin}
      >
        Continue
      </Button>
    </Stack>
  );
}
