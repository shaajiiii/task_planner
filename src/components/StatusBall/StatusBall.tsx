import { getStatusColor } from "@/utils/Tasks";
import { Chip } from "@mui/material";

export interface StatusBallProps {
  status: string;
}

function StatusBall({ status = "" }: StatusBallProps) {
  return (
    <Chip
      size="small"
      sx={{
        backgroundColor: getStatusColor(status),
        height: 10,
        width: 10,
        border: "1px solid white",
        marginRight: "5px",
      }}
    />
  );
}

export default StatusBall;
