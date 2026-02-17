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

import { createContext, useContext, type JSX, type ReactNode } from "react";

/** Mock mode is removed; this stub exists so existing imports resolve. isMockEnabled is always false. */
const MockConfigContext = createContext<{ isMockEnabled: boolean }>({
  isMockEnabled: false,
});

export function useMockConfig(): { isMockEnabled: boolean } {
  return useContext(MockConfigContext);
}

interface MockConfigProviderProps {
  children: ReactNode;
}

/**
 * Stub provider for mock config. Renders children only; mock mode is disabled.
 *
 * @param props - children.
 * @returns {JSX.Element}
 */
export function MockConfigProvider({ children }: MockConfigProviderProps): JSX.Element {
  return (
    <MockConfigContext.Provider value={{ isMockEnabled: false }}>
      {children}
    </MockConfigContext.Provider>
  );
}
