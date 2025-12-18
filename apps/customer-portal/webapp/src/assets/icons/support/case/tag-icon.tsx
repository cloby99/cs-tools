import React from "react";
import type { IconProps } from "../../../../types/icon.types";
import { BaseIcon } from "../../BaseIcon";

export const TagIcon: React.FC<IconProps> = (props) => {
  // Use color from props or default to currentColor if not provided
  // Note: standard BaseIcon takes color prop and passes it to stroke.
  // The original TagIcon used the color prop for the fill of the circle as well.
  // We'll reuse the color prop for the circle fill.
  const { color = "currentColor" } = props;

  return (
    <BaseIcon {...props}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill={color} />
    </BaseIcon>
  );
};
