import React from "react";
import { BaseIcon } from "./BaseIcon";
import type { IconProps } from "../../../types/icon.types";

export const CircleXIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </BaseIcon>
);
