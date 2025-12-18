import React from "react";
import type { IconProps } from "../../../types/icon.types";
import { BaseIcon } from "./BaseIcon";

export const BotIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M12 8V4H8"></path>
    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
    <path d="M2 14h2"></path>
    <path d="M20 14h2"></path>
    <path d="M15 13v2"></path>
    <path d="M9 13v2"></path>
  </BaseIcon>
);
