import React from "react";
import {
  Box,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  IconButton,
  Typography,
  Divider,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useCalendar } from "@/context/CalendarContext";

// Define available status options
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "#ff9800" },
  { value: "in-progress", label: "In Progress", color: "#2196f3" },
  { value: "completed", label: "Completed", color: "#4caf50" },
];

const CalendarSearchFilterBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredEvents,
    events,
    clearFilters,
  } = useCalendar();

  const handleStatusFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setStatusFilter(typeof value === "string" ? value.split(",") : value);
  };

  const handleRemoveStatusFilter = (statusToRemove: string) => {
    setStatusFilter(statusFilter.filter((status) => status !== statusToRemove));
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter.length > 0;
  const filteredCount = filteredEvents.length;
  const totalCount = events.length;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      {/* Search and Filter Controls */}
      <Box
        sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
      >
        {/* Search Input */}
        <TextField
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 250, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
            ),
            endAdornment: searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery("")}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            ),
          }}
        />

        {/* Status Filter */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            multiple
            value={statusFilter}
            onChange={handleStatusFilterChange}
            input={<OutlinedInput label="Filter by Status" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((value) => {
                  const option = STATUS_OPTIONS.find(
                    (opt) => opt.value === value
                  );
                  return (
                    <Chip
                      key={value}
                      label={option?.label || value}
                      size="small"
                      sx={{
                        backgroundColor: option?.color || "#gray",
                        color: "white",
                        fontSize: 12,
                      }}
                      onDelete={() => handleRemoveStatusFilter(value)}
                      onMouseDown={(event) => event.stopPropagation()}
                    />
                  );
                })}
              </Box>
            )}
            MenuProps={{
              PaperProps: {
                style: { maxHeight: 224, width: 250 },
              },
              anchorOrigin: {
                vertical: "bottom",
                horizontal: "left",
              },
              transformOrigin: {
                vertical: "top",
                horizontal: "left",
              },
              sx: {
                marginTop: 1,
              },
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: option.color,
                    }}
                  />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <IconButton
            onClick={clearFilters}
            size="small"
            sx={{ ml: 1 }}
            title="Clear all filters"
          >
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {/* Results Summary */}
      {hasActiveFilters && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FilterListIcon sx={{ color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              Showing {filteredCount} of {totalCount} tasks
              {searchQuery && <span> • Search: "{searchQuery}"</span>}
              {statusFilter.length > 0 && (
                <span>
                  {" "}
                  • Status:{" "}
                  {statusFilter
                    .map(
                      (s) =>
                        STATUS_OPTIONS.find((opt) => opt.value === s)?.label ||
                        s
                    )
                    .join(", ")}
                </span>
              )}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CalendarSearchFilterBar;
