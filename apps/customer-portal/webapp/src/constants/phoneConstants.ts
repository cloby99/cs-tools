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

/** Country dial code and name for phone input. */
export interface PhoneCountryOption {
  dialCode: string;
  countryCode: string;
  label: string;
  flag: string;
}

/** Common country options for phone input (E.164). */
export const PHONE_COUNTRY_OPTIONS: PhoneCountryOption[] = [
  { dialCode: "+1", countryCode: "US", label: "United States (+1)", flag: "🇺🇸" },
  { dialCode: "+44", countryCode: "GB", label: "United Kingdom (+44)", flag: "🇬🇧" },
  { dialCode: "+91", countryCode: "IN", label: "India (+91)", flag: "🇮🇳" },
  { dialCode: "+94", countryCode: "LK", label: "Sri Lanka (+94)", flag: "🇱🇰" },
  { dialCode: "+61", countryCode: "AU", label: "Australia (+61)", flag: "🇦🇺" },
  { dialCode: "+81", countryCode: "JP", label: "Japan (+81)", flag: "🇯🇵" },
  { dialCode: "+49", countryCode: "DE", label: "Germany (+49)", flag: "🇩🇪" },
  { dialCode: "+33", countryCode: "FR", label: "France (+33)", flag: "🇫🇷" },
  { dialCode: "+39", countryCode: "IT", label: "Italy (+39)", flag: "🇮🇹" },
  { dialCode: "+34", countryCode: "ES", label: "Spain (+34)", flag: "🇪🇸" },
  { dialCode: "+31", countryCode: "NL", label: "Netherlands (+31)", flag: "🇳🇱" },
  { dialCode: "+41", countryCode: "CH", label: "Switzerland (+41)", flag: "🇨🇭" },
  { dialCode: "+65", countryCode: "SG", label: "Singapore (+65)", flag: "🇸🇬" },
  { dialCode: "+60", countryCode: "MY", label: "Malaysia (+60)", flag: "🇲🇾" },
  { dialCode: "+66", countryCode: "TH", label: "Thailand (+66)", flag: "🇹🇭" },
  { dialCode: "+64", countryCode: "NZ", label: "New Zealand (+64)", flag: "🇳🇿" },
  { dialCode: "+27", countryCode: "ZA", label: "South Africa (+27)", flag: "🇿🇦" },
  { dialCode: "+55", countryCode: "BR", label: "Brazil (+55)", flag: "🇧🇷" },
  { dialCode: "+52", countryCode: "MX", label: "Mexico (+52)", flag: "🇲🇽" },
  { dialCode: "+86", countryCode: "CN", label: "China (+86)", flag: "🇨🇳" },
  { dialCode: "+82", countryCode: "KR", label: "South Korea (+82)", flag: "🇰🇷" },
  { dialCode: "+971", countryCode: "AE", label: "UAE (+971)", flag: "🇦🇪" },
  { dialCode: "+966", countryCode: "SA", label: "Saudi Arabia (+966)", flag: "🇸🇦" },
  { dialCode: "+353", countryCode: "IE", label: "Ireland (+353)", flag: "🇮🇪" },
  { dialCode: "+358", countryCode: "FI", label: "Finland (+358)", flag: "🇫🇮" },
  { dialCode: "+46", countryCode: "SE", label: "Sweden (+46)", flag: "🇸🇪" },
  { dialCode: "+47", countryCode: "NO", label: "Norway (+47)", flag: "🇳🇴" },
  { dialCode: "+45", countryCode: "DK", label: "Denmark (+45)", flag: "🇩🇰" },
  { dialCode: "+48", countryCode: "PL", label: "Poland (+48)", flag: "🇵🇱" },
  { dialCode: "+32", countryCode: "BE", label: "Belgium (+32)", flag: "🇧🇪" },
  { dialCode: "+43", countryCode: "AT", label: "Austria (+43)", flag: "🇦🇹" },
  { dialCode: "+63", countryCode: "PH", label: "Philippines (+63)", flag: "🇵🇭" },
  { dialCode: "+62", countryCode: "ID", label: "Indonesia (+62)", flag: "🇮🇩" },
  { dialCode: "+84", countryCode: "VN", label: "Vietnam (+84)", flag: "🇻🇳" },
  { dialCode: "+880", countryCode: "BD", label: "Bangladesh (+880)", flag: "🇧🇩" },
  { dialCode: "+92", countryCode: "PK", label: "Pakistan (+92)", flag: "🇵🇰" },
  { dialCode: "+20", countryCode: "EG", label: "Egypt (+20)", flag: "🇪🇬" },
  { dialCode: "+234", countryCode: "NG", label: "Nigeria (+234)", flag: "🇳🇬" },
  { dialCode: "+254", countryCode: "KE", label: "Kenya (+254)", flag: "🇰🇪" },
  { dialCode: "+7", countryCode: "RU", label: "Russia (+7)", flag: "🇷🇺" },
  { dialCode: "+90", countryCode: "TR", label: "Turkey (+90)", flag: "🇹🇷" },
  { dialCode: "+977", countryCode: "NP", label: "Nepal (+977)", flag: "🇳🇵" },
];

/**
 * Format E.164 phone for display (e.g. "+1 555 123 4567").
 *
 * @param e164 - E.164 string (e.g. "+15551234567").
 * @returns Formatted string or empty.
 */
export function formatPhoneForDisplay(e164: string | null | undefined): string {
  if (!e164?.trim()) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 10) return e164;
  const match = e164.match(/^(\+\d{1,4})(\d+)$/);
  if (match) {
    const [, code, rest] = match;
    const grouped = rest.replace(/(\d{3})(?=\d)/g, "$1 ");
    return `${code} ${grouped}`.trim();
  }
  return e164;
}

/**
 * Parse E.164 to { countryCode, nationalNumber }.
 *
 * @param e164 - E.164 string.
 * @returns Parsed parts.
 */
export function parseE164(
  e164: string | null | undefined,
): { countryCode: string; nationalNumber: string } {
  if (!e164?.trim()) return { countryCode: "+1", nationalNumber: "" };
  const digits = e164.replace(/\D/g, "");
  if (digits.length === 0) return { countryCode: "+1", nationalNumber: "" };
  for (let len = 4; len >= 1; len--) {
    const code = "+" + digits.slice(0, len);
    const rest = digits.slice(len);
    const opt = PHONE_COUNTRY_OPTIONS.find((o) => o.dialCode === code);
    if (opt && rest.length >= 5) {
      return { countryCode: code, nationalNumber: rest };
    }
  }
  return { countryCode: "+1", nationalNumber: digits };
}

/** Build E.164 from country code and national number. */
export function toE164(countryCode: string, nationalNumber: string): string {
  const digits = nationalNumber.replace(/\D/g, "");
  const code = countryCode.startsWith("+") ? countryCode : `+${countryCode}`;
  return digits ? code + digits : "";
}

/** E.164 regex: + followed by 10–15 digits. */
const E164_REGEX = /^\+[1-9]\d{9,14}$/;

/**
 * Validate E.164 phone. Empty is allowed (optional field).
 *
 * @param value - E.164 string.
 * @returns Error message or empty if valid.
 */
export function validatePhoneE164(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  if (!E164_REGEX.test(trimmed)) {
    return "Please enter a valid phone number in E.164 format (e.g. +1234567890)";
  }
  return "";
}
