// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Box, Card, Typography, Button } from "@mui/material";
import { LogIn } from "lucide-react";

interface StatusWithActionProps {
  action: () => void;
}

const StatusWithAction: React.FC<StatusWithActionProps> = ({ action }) => {
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
          maxWidth: 400,
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
          <LogIn size={48} color="#6366f1" />
        </Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Signed Out
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You have been signed out. Click below to sign in again.
        </Typography>
        <Button
          variant="contained"
          onClick={action}
          startIcon={<LogIn size={20} />}
          sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
        >
          Sign In
        </Button>
      </Card>
    </Box>
  );
};

export default StatusWithAction;
