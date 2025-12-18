import React from "react";
import { Box, Typography, Card } from "@mui/material";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: string;
  trendIcon?: React.ReactNode;
  trendLabelColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend,
  trendIcon,
  trendLabelColor = "#059669",
}) => {
  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        p: "20px",
        boxShadow: 0,
        "&:hover": { boxShadow: 1 },
        transition: "box-shadow 0.2s",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          mb: "12px",
        }}
      >
        <Box
          sx={{
            p: "8px",
            borderRadius: "8px",
            bgcolor: iconBgColor,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>

        {trend && trendIcon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.875rem",
            }}
          >
            {trendIcon}
            <Typography sx={{ color: trendLabelColor, fontSize: "0.875rem" }}>
              {trend}
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <Typography sx={{ fontSize: "1.5rem", color: "#111827" }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#4b5563" }}>
          {title}
        </Typography>
      </Box>
    </Card>
  );
};

export default StatCard;
