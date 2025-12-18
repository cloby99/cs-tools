// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Box, Card, Typography, Button } from "@mui/material";
import { AlertCircle } from "lucide-react";

interface ErrorHandlerProps {
  message: string;
  onRetry?: () => void;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({ message, onRetry }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#f9fafb",
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          p: 4,
          textAlign: "center",
          boxShadow: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <AlertCircle size={48} color="#ef4444" />
        </Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Authentication Error
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>
        {onRetry && (
          <Button variant="contained" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Card>
    </Box>
  );
};

export default ErrorHandler;
