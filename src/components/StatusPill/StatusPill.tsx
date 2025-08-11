import { getStatusColor, getStatusText } from "@/constants/Tasks";
import { Box, Chip } from "@mui/material";

export interface StatusBallProps {
  status: string;
}

function StatusPill({ status = "" }: StatusBallProps) {
  return (
    <Box sx={{ my: 2 }}>
      <Chip
        label={getStatusText(status)}
        sx={{
          backgroundColor: getStatusColor(status),
        }}
      />
    </Box>
  );
}

export default StatusPill;
