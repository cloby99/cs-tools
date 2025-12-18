import React from "react";
import { BaseIcon } from "./BaseIcon";
import type { IconProps } from "../../../types/icon.types";

export const CirclePlayIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" />
  </BaseIcon>
);
