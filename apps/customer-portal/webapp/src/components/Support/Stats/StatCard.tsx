import { Box, Card, Typography } from "@mui/material";
import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  secondaryIcon?: React.ReactNode;
  value: number;
  label: string;
  iconColor: string;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  secondaryIcon,
  value,
  label,
  iconColor,
  compact = false,
}) => {
  if (compact) {
    return (
      <Card
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "grey.200",
          boxShadow: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              color: iconColor,
              display: "flex",
              alignItems: "center",
              "& svg": { width: 16, height: 16 },
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.75rem" }}
          >
            {label}
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 400, color: "grey.900" }}>
          {value}
        </Typography>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "grey.200",
        boxShadow: "none",
        height: "100%",
        position: "relative",
        overflow: "visible",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ color: iconColor }}>{icon}</Box>
        {secondaryIcon && <Box sx={{ color: "grey.400" }}>{secondaryIcon}</Box>}
      </Box>
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 400, mb: 0.5, fontSize: "1.5rem" }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Card>
  );
};
