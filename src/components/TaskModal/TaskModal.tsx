import * as React from "react";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";

export interface TaskModalProps {
  open: boolean;
  selectedEvent: any; // m: change to the exact type
  onClose: () => void;
  onSave: (eventToBeSaved: any) => void; // m: change to the exact type
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function TaskModal(props: TaskModalProps) {
  const { open, onClose, onSave, selectedEvent } = props;

  const [title, setTitle] = React.useState(selectedEvent?.label);
  const [status, setStatus] = React.useState(selectedEvent?.status);

  // Reset inputs when modal opens
  React.useEffect(() => {
    if (open) {
      setTitle(selectedEvent?.label);
      setStatus(selectedEvent?.status);
    }
  }, [open, selectedEvent]);

  const handleSave = () => {
    const eventToBeSaved = {
      ...selectedEvent,
      label: title.trim(),
      status,
    };
    onSave(eventToBeSaved);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title?.trim()) {
      e.preventDefault();
      handleSave();
    }
  };
  return (
    <Dialog onClose={onClose} open={open} onKeyDown={handleKeyDown}>
      <DialogTitle>
        {selectedEvent?.label ? "Edit Task" : "Add New Task"}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          label="Task Title"
          fullWidth
          margin="normal"
          autoFocus
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          fullWidth
          margin="normal"
        >
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={title?.trim() === ""}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskModal;
