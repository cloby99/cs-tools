import React from "react";
import type { IconProps } from "../../../types/icon.types";

export type BaseIconProps = IconProps;

export const BaseIcon: React.FC<IconProps & { children: React.ReactNode }> = ({
  width = 24,
  height = 24,
  color = "currentColor",
  children,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
