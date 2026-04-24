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

import { useState, type JSX } from "react";
import { announcementBannerConfig } from "@config/announcementBannerConfig";

function isDismissed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === "dismissed";
  } catch {
    return false;
  }
}

function persistDismissal(storageKey: string): void {
  try {
    localStorage.setItem(storageKey, "dismissed");
  } catch {
    // ignore storage errors
  }
}

/**
 * HTML-rendering announcement banner shown below the main notification banner.
 * Dismissed state is persisted in localStorage per storageKey.
 */
export default function HtmlAnnouncementBanner(): JSX.Element | null {
  const { visible, storageKey, html } = announcementBannerConfig;

  const [closed, setClosed] = useState(() => isDismissed(storageKey));

  if (!visible || closed) return null;

  const handleClose = () => {
    persistDismissal(storageKey);
    setClosed(true);
  };

  return (
    <div
      style={{
        position: "relative",
        background: "#fff8e1",
        borderBottom: "1px solid #ffe082",
        padding: "10px 48px 10px 16px",
        fontSize: 14,
        lineHeight: 1.5,
        color: "#5d4037",
      }}
    >
      {/* eslint-disable-next-line react/no-danger */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <button
        onClick={handleClose}
        aria-label="Close announcement"
        style={{
          position: "absolute",
          top: "50%",
          right: 12,
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          color: "#8d6e63",
          padding: "2px 6px",
          borderRadius: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}
