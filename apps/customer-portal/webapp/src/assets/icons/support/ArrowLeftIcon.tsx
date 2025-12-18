import React from "react";
import type { IconProps } from "../../../types/icon.types";
import { BaseIcon } from "./BaseIcon";

export const ArrowLeftIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="m12 19-7-7 7-7"></path>
    <path d="M19 12H5"></path>
  </BaseIcon>
);
