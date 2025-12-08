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
# Add users to a group via SCIM operations.
#
# + groupName - Name/ID of the group to add users to
# + request - Request payload containing user emails
# + return - Response with added/failed users or error
public isolated function addUsersToGroup(string groupName, AddUsersRequest request)
        returns AddUsersResponse|error {
    return scimHttpClient->/[scimConfig.orgPath]/groups/[groupName]/users.post(request, targetType = AddUsersResponse);
}
