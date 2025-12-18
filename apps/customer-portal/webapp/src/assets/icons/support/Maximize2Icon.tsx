import React from "react";
import { BaseIcon } from "./BaseIcon";
import type { IconProps } from "../../../types/icon.types";

export const Maximize2Icon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <path d="M15 3h6v6" />
    <path d="m21 3-7 7" />
    <path d="m3 21 7-7" />
    <path d="M9 21H3v-6" />
  </BaseIcon>
);
