
import { Box } from "@mui/material";

const Divider = () => {
  return (
    <Box
      sx={{
        borderTop: (theme) => `1px solid ${theme.palette.grey[200]}`,
        my: 0.5,
      }}
    />
  );
};

export default Divider;

