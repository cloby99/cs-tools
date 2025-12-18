import React from "react";
import type { IconProps } from "../../../types/icon.types";
import { BaseIcon } from "./BaseIcon";

export const ArrowRightIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </BaseIcon>
);
