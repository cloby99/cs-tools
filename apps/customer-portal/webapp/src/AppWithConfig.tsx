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

import type { JSX } from "react";
import { OxygenUIThemeProvider } from "@wso2/oxygen-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "@/App";
import { AsgardeoProvider } from "@asgardeo/react";
import { themeConfig } from "@/config/themeConfig";
import { loggerConfig } from "@/config/loggerConfig";
import LoggerProvider from "@/context/logger/LoggerProvider";

import { MockConfigProvider } from "@/providers/MockConfigProvider";

const queryClient: QueryClient = new QueryClient();

export default function AppWithConfig(): JSX.Element {
  return (
    <AsgardeoProvider
      baseUrl={import.meta.env.CUSTOMER_PORTAL_AUTH_BASE_URL as string}
      clientId={import.meta.env.CUSTOMER_PORTAL_AUTH_CLIENT_ID as string}
      afterSignInUrl={
        import.meta.env.CUSTOMER_PORTAL_AUTH_SIGN_IN_REDIRECT_URL as string
      }
      afterSignOutUrl={
        import.meta.env.CUSTOMER_PORTAL_AUTH_SIGN_OUT_REDIRECT_URL as string
      }
      scopes={["openid", "email", "groups"]}
    >
      <MockConfigProvider>
        <LoggerProvider config={loggerConfig}>
          <OxygenUIThemeProvider theme={themeConfig}>
            <QueryClientProvider client={queryClient}>
              <App />
              <ReactQueryDevtools initialIsOpen={false} />
            </QueryClientProvider>
          </OxygenUIThemeProvider>
        </LoggerProvider>
      </MockConfigProvider>
    </AsgardeoProvider>
  );
}
