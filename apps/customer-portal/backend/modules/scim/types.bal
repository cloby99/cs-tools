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

# SCIM service client configuration.
public type ScimServiceConfig record {|
    # Base URL of the SCIM operations service
    string serviceUrl;
    # Organization path for SCIM operations
    string orgPath;
    # OAuth 2.0 token endpoint URL
    string tokenUrl;
    # OAuth 2.0 client ID
    string clientId;
    # OAuth 2.0 client secret
    string clientSecret;
    # OAuth 2.0 scopes
    string[] scopes = [];
|};

# Request payload for adding users to a group.
public type AddUsersRequest record {|
    # Array of user email addresses to be added to the group
    string[] emails;
|};

# Response payload for add users operation.
public type AddUsersResponse record {|
    # List of users successfully added to the group
    string[] addedUsers;
    # List of users that failed to be added
    string[] failedUsers;
|};

