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
import ballerina/http;

configurable ScimServiceConfig scimConfig = ?;
configurable http:RetryConfig retryConfig = ?;

# SCIM HTTP Client for interacting with the internal SCIM operations service.
# Authentication uses OAuth 2.0 Client Credentials Grant.
@display {
    label: "SCIM Operations Service",
    id: "customer-portal/scim-service"
}
final http:Client scimHttpClient = check new (scimConfig.serviceUrl, {
    timeout: 20.0d,
    retryConfig: {
        ...retryConfig
    },
    auth: {
        tokenUrl: scimConfig.tokenUrl,
        clientId: scimConfig.clientId,
        clientSecret: scimConfig.clientSecret,
        scopes: scimConfig.scopes
    }
});
