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
import ballerina/lang.regexp as regexp;

// Pre-compiled email validation regex pattern for better performance.
final regexp:RegExp EMAIL_PATTERN = re `^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$`;

# Validate email format using pre-compiled regex pattern.
#
# + email - Email address to validate
# + return - True if email is valid, false otherwise
public isolated function isValidEmail(string email) returns boolean {
    string trimmedEmail = email.trim();
    return regexp:isFullMatch(EMAIL_PATTERN, trimmedEmail);
}

# Validate group name.
#
# + groupName - Group name to validate
# + return - Error if invalid, nil if valid
public isolated function validateGroupName(string groupName) returns error? {
    if groupName.trim() == "" {
        return error(ERR_MSG_GROUP_EMPTY);
    }
    return;
}

# Validate emails array.
#
# + emails - Array of email addresses
# + return - Error if invalid (empty or contains invalid emails), nil if valid
public isolated function validateEmails(string[] emails) returns error? {
    if emails.length() == 0 {
        return error(ERR_MSG_EMAILS_EMPTY);
    }
    
    // Validate each email format
    foreach string email in emails {
        if !isValidEmail(email) {
            return error(string `${ERR_MSG_INVALID_EMAIL}: ${email}`);
        }
    }
    
    return;
}
