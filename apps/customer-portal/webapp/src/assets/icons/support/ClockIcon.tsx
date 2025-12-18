import React from "react";
import type { IconProps } from "../../../types/icon.types";
import { BaseIcon } from "./BaseIcon";

export const ClockIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M12 6v6l4 2"></path>
    <circle cx="12" cy="12" r="10"></circle>
  </BaseIcon>
);
