import { useState } from "react";
import Calendar from "@/components/Calender";
import CalendarSearchFilterBar from "@/components/SearchAndFilter";
import { CalendarProvider } from "@/context/CalendarContext";
import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const Home = () => {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {open && (
        <Alert
          severity="info"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          Drag to resize is currently buggy, therefore not implemented yet. This
          is a 30 day layout; calendar/time integration is pending, so filters
          don't include time. Since I'm late on submission, I'm turning it in
          as-is.
          <b> Total time spent: 12-14 hours.</b>
        </Alert>
      )}

      <CalendarProvider>
        <CalendarSearchFilterBar />
        <Calendar />
      </CalendarProvider>
    </div>
  );
};
