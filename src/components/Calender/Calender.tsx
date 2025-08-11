import * as React from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import {
  DndContext,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
} from "@dnd-kit/core";
import TaskModal from "../TaskModal";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/CloseRounded";
import StatusBall from "../StatusBall";
import StatusPill from "../StatusPill";
import { formatDayRange } from "@/utils/Tasks";

type CalendarEvent = {
  id?: string;
  start: number;
  end: number;
  label: string;
  color?: string;
  time?: string;
  status: string;
};

type Segment = {
  event: CalendarEvent;
  isStart: boolean;
  isEnd: boolean;
  startCol: number;
  endCol: number;
  trackIndex?: number;
  weekIndex: number;
};

const TRACK_HEIGHT = 20;
const TRACK_GAP = 6;
const WEEK_ROW_HEIGHT = 130;
const TOP_OFFSET__FOR_TASKS = 30;

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

function splitEventsIntoSegments(
  events: CalendarEvent[],
  startDay: number
): Map<number, Segment[]> {
  const segmentsByWeek = new Map<number, Segment[]>();

  events.forEach((event) => {
    const start = event.start;
    const end = event.end;
    const startOffset = start + startDay - 1;
    const endOffset = end + startDay - 1;
    let currentStart = startOffset;

    while (currentStart <= endOffset) {
      const currentWeek = Math.floor(currentStart / 7);
      const weekStartCol = currentWeek * 7;
      const weekEndCol = weekStartCol + 6;
      const segmentStartCol = currentStart - weekStartCol + 1;
      const segmentEndCol = Math.min(endOffset, weekEndCol) - weekStartCol + 1;

      const segment: Segment = {
        event,
        isStart: currentStart === startOffset,
        isEnd: segmentEndCol + weekStartCol === endOffset,
        startCol: segmentStartCol,
        endCol: segmentEndCol,
        weekIndex: currentWeek,
      };

      if (!segmentsByWeek.has(currentWeek)) segmentsByWeek.set(currentWeek, []);
      segmentsByWeek.get(currentWeek)!.push(segment);

      currentStart = weekEndCol + 1;
    }
  });

  // Assign tracks so segments in same week don't overlap
  for (const [, segments] of segmentsByWeek.entries()) {
    const tracks: Segment[][] = [];
    segments.forEach((seg) => {
      let placed = false;
      for (let i = 0; i < tracks.length; i++) {
        if (
          !tracks[i].some(
            (s) =>
              (seg.startCol >= s.startCol && seg.startCol <= s.endCol) ||
              (seg.endCol >= s.startCol && seg.endCol <= s.endCol) ||
              (seg.startCol <= s.startCol && seg.endCol >= s.endCol)
          )
        ) {
          seg.trackIndex = i;
          tracks[i].push(seg);
          placed = true;
          break;
        }
      }
      if (!placed) {
        seg.trackIndex = tracks.length;
        tracks.push([seg]);
      }
    });
  }

  return segmentsByWeek;
}

function DraggableEvent({
  seg,
  id,
  dimmed,
  onClick,
}: {
  seg: Segment;
  id: string;
  dimmed?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  // small movement threshold (match activationConstraint)
  const CLICK_MOVE_THRESHOLD = 6;

  const startPosRef = React.useRef<{ x: number; y: number } | null>(null);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const leftPct = (seg.startCol - 1) * (100 / 7);
  const widthPct = (seg.endCol - seg.startCol + 1) * (100 / 7);
  const topPx =
    seg.weekIndex * WEEK_ROW_HEIGHT +
    (seg.trackIndex ?? 0) * (TRACK_HEIGHT + TRACK_GAP) +
    TOP_OFFSET__FOR_TASKS;

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    position: "absolute",
    left: `${leftPct}%`,
    width: `${widthPct}%`,
    top: topPx,
    height: TRACK_HEIGHT,
    backgroundColor: dimmed ? "#e0e0e0" : seg.event.color ?? "#1976d2",
    color: dimmed ? "#757575" : "#fff",
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    borderRadius: 6,
    cursor: "grab",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    zIndex: transform ? 1000 : 2,
    opacity: dimmed ? 0.7 : 1,
    userSelect: "none",
    touchAction: "manipulation",
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // only left button
    if ("button" in e && e.button !== 0) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    // call dnd-kit listener with native event (more reliable)
    listeners?.onPointerDown?.(e.nativeEvent as unknown as PointerEvent);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = startPosRef.current;
    startPosRef.current = null;
    if (!start) return;
    const moved = Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
    if (moved < CLICK_MOVE_THRESHOLD) {
      // treat as click
      onClick?.(e as unknown as React.MouseEvent<HTMLElement>);
    }
    // no need to call listeners.onPointerUp
  };

  return (
    <div
      ref={setNodeRef}
      // spread listeners first so we still have access to them, then override pointerDown to call both
      {...listeners}
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      style={style}
      title={`${seg.event.label} (${seg.event.start}-${seg.event.end})`}
    >
      {seg.event.time && seg.isStart && (
        <strong style={{ marginRight: 8, fontSize: 12 }}>
          {seg.event.time}
        </strong>
      )}
      <StatusBall status={seg.event.status} />
      <span style={{ fontSize: 13 }}>{seg.event.label}</span>
    </div>
  );
}

function DroppableCell({
  cellIndex,
  children,
  highlight,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
}: {
  cellIndex: number;
  children?: React.ReactNode;
  highlight?: boolean;
  onCellPointerDown?: (cellIndex: number) => void;
  onCellPointerEnter?: (cellIndex: number) => void;
  onCellPointerUp?: () => void;
}) {
  const { setNodeRef } = useDroppable({ id: `cell-${cellIndex}` });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        borderRight: "1px solid rgba(0,0,0,0.06)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        px: 1,
        pt: 1,
        minHeight: WEEK_ROW_HEIGHT,
        boxSizing: "border-box",
        position: "relative",
        "&::after": highlight
          ? {
              content: '""',
              position: "absolute",
              left: 4,
              right: 4,
              top: 6,
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(25,118,210,0.9)",
            }
          : undefined,
      }}
      onPointerDown={(e) => {
        if (onCellPointerDown && e.button === 0) {
          onCellPointerDown(cellIndex);
        }
      }}
      onPointerEnter={() => onCellPointerEnter?.(cellIndex)}
      onPointerUp={() => onCellPointerUp?.()}
    >
      {children}
    </Box>
  );
}

export default function CalendarMonth() {
  const year = 2024;
  const month = 9; // October (0-based)

  const [events, setEvents] = React.useState<CalendarEvent[]>([]);

  // Modal states and functions ----------
  const [selectedEvent, setSelectedEvent] =
    React.useState<CalendarEvent | null>(null);

  const [openTaskModal, setOpenTaskModal] = React.useState<boolean>(false);

  const closeTaskModal = React.useCallback(() => {
    setOpenTaskModal(false);
    setSelectedEvent(null);
  }, []);

  const saveEventToMainEventsState = React.useCallback(
    (newOrUpdatedEvent: CalendarEvent, isEdit: Boolean) => {
      setEvents((prev) => {
        if (isEdit) {
          // Edit flow → replace event with matching id
          return prev.map((ev) =>
            ev.id === newOrUpdatedEvent.id ? newOrUpdatedEvent : ev
          );
        } else {
          // Create flow
          return [...prev, newOrUpdatedEvent];
        }
      });
      closeTaskModal();
    },
    []
  );

  // pop over states and functions ------------------------
  const [popoverAnchor, setPopoverAnchor] = React.useState<HTMLElement | null>(
    null
  );
  const [popoverEvent, setPopoverEvent] = React.useState<CalendarEvent | null>(
    null
  );

  const handleEventClick = (
    event: React.MouseEvent<HTMLElement>,
    evData: CalendarEvent
  ) => {
    setPopoverAnchor(event.currentTarget);
    setPopoverEvent(evData);
  };

  const handlePopoverClose = () => {
    setPopoverAnchor(null);
    setTimeout(() => {
      setPopoverEvent(null);
    }, 500);
  };

  const handleEditEvent = () => {
    if (popoverEvent) {
      setSelectedEvent(popoverEvent);
      setOpenTaskModal(true);
    }
    handlePopoverClose();
  };

  const handleDeleteEvent = () => {
    if (popoverEvent) {
      setEvents((prev) => prev.filter((e) => e !== popoverEvent));
    }
    handlePopoverClose();
  };

  // sensors: ensure drag doesn't start until user moves enough
  const MOUSE_ACTIVATION_DISTANCE = 6;
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: MOUSE_ACTIVATION_DISTANCE },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = getDayOfWeek(year, month, 1);
  const weeksCount = Math.ceil((startDay + daysInMonth) / 7);
  const totalCells = weeksCount * 7;

  const segmentsByWeek = React.useMemo(
    () => splitEventsIntoSegments(events, startDay),
    [events, daysInMonth, startDay]
  );

  const [draggedEventIndex, setDraggedEventIndex] = React.useState<
    number | null
  >(null);
  const [hoverCellIndex, setHoverCellIndex] = React.useState<number | null>(
    null
  );

  // For drag-to-create
  const [selectStartCell, setSelectStartCell] = React.useState<number | null>(
    null
  );
  const [selectEndCell, setSelectEndCell] = React.useState<number | null>(null);

  function previewSegmentsFor(newStartDay: number, durationDays: number) {
    const segs: { weekIndex: number; startCol: number; endCol: number }[] = [];
    const startOffset = newStartDay + startDay - 1;
    const endOffset = startOffset + durationDays - 1;
    let cur = startOffset;
    while (cur <= endOffset) {
      const weekIndex = Math.floor(cur / 7);
      const weekStartCol = weekIndex * 7;
      const weekEndCol = weekStartCol + 6;
      const segStartCol = cur - weekStartCol + 1;
      const segEndCol = Math.min(endOffset, weekEndCol) - weekStartCol + 1;
      segs.push({ weekIndex, startCol: segStartCol, endCol: segEndCol });
      cur = weekEndCol + 1;
    }
    return segs;
  }

  // Drag-and-drop event moving logic
  function handleDragStart(event: DragStartEvent) {
    const activeId = event.active.id;
    if (typeof activeId === "string" && activeId.startsWith("event-")) {
      const idx = parseInt(activeId.replace("event-", ""), 10);
      if (!Number.isNaN(idx)) setDraggedEventIndex(idx);
    } else {
      setDraggedEventIndex(null);
    }
    setHoverCellIndex(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (overId && overId.startsWith("cell-")) {
      const newCellIndex = parseInt(overId.replace("cell-", ""), 10);
      if (!Number.isNaN(newCellIndex)) setHoverCellIndex(newCellIndex);
      else setHoverCellIndex(null);
    } else {
      setHoverCellIndex(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setHoverCellIndex(null);

    if (!over) {
      setDraggedEventIndex(null);
      return;
    }
    const overId = over.id as string;
    if (!overId.startsWith("cell-")) {
      setDraggedEventIndex(null);
      return;
    }

    const newCellIndex = parseInt(overId.replace("cell-", ""), 10);
    if (Number.isNaN(newCellIndex)) {
      setDraggedEventIndex(null);
      return;
    }
    const newDay = newCellIndex - startDay + 1;
    if (newDay < 1 || newDay > daysInMonth) {
      setDraggedEventIndex(null);
      return;
    }

    const activeId = active.id as string;
    if (activeId.startsWith("event-")) {
      const idx = parseInt(activeId.replace("event-", ""), 10);
      if (!Number.isNaN(idx)) {
        setEvents((prev) =>
          prev.map((ev, i) => {
            if (i === idx) {
              const duration = ev.end - ev.start + 1;
              let newStart = newDay;
              let newEnd = newDay + duration - 1;

              if (newEnd > daysInMonth) {
                newEnd = daysInMonth;
                newStart = Math.max(1, daysInMonth - duration + 1);
              }
              return { ...ev, start: newStart, end: newEnd };
            }
            return ev;
          })
        );
      }
    }

    setDraggedEventIndex(null);
  }

  function handleDragCancel(_: DragCancelEvent) {
    setHoverCellIndex(null);
    setDraggedEventIndex(null);
  }

  // --- Drag-to-Create Handlers ---
  function handleCellPointerDown(cellIdx: number) {
    if (draggedEventIndex !== null) return;
    setSelectStartCell(cellIdx);
    setSelectEndCell(cellIdx);
  }
  function handleCellPointerEnter(cellIdx: number) {
    if (selectStartCell !== null) setSelectEndCell(cellIdx);
  }
  function handleCellPointerUp() {
    if (selectStartCell !== null && selectEndCell !== null) {
      const dayA = selectStartCell - startDay + 1;
      const dayB = selectEndCell - startDay + 1;
      if (
        dayA >= 1 &&
        dayA <= daysInMonth &&
        dayB >= 1 &&
        dayB <= daysInMonth
      ) {
        const newStart = Math.min(dayA, dayB);
        const newEnd = Math.max(dayA, dayB);
        setSelectedEvent({
          // temporary task created here
          start: newStart,
          end: newEnd,
          label: "",
          color: "#1976d2",
          status: "pending",
        });
        setOpenTaskModal(true);
      }
    }
    setSelectStartCell(null);
    setSelectEndCell(null);
  }

  const previewSegments = React.useMemo(() => {
    if (draggedEventIndex == null || hoverCellIndex == null) return [];
    const ev = events[draggedEventIndex];
    if (!ev) return [];
    const newDay = hoverCellIndex - startDay + 1;
    if (newDay < 1 || newDay > daysInMonth) return [];
    const duration = ev.end - ev.start + 1;
    return previewSegmentsFor(newDay, duration);
  }, [draggedEventIndex, hoverCellIndex, events, startDay, daysInMonth]);

  // For drag-to-create: "ghost" preview
  const selectPreview = React.useMemo(() => {
    if (
      selectStartCell == null ||
      selectEndCell == null ||
      draggedEventIndex !== null
    )
      return [];
    const dayA = selectStartCell - startDay + 1;
    const dayB = selectEndCell - startDay + 1;
    if (dayA < 1 || dayA > daysInMonth || dayB < 1 || dayB > daysInMonth)
      return [];
    const newStart = Math.min(dayA, dayB);
    const duration = Math.abs(dayA - dayB) + 1;
    return previewSegmentsFor(newStart, duration);
  }, [
    selectStartCell,
    selectEndCell,
    startDay,
    daysInMonth,
    draggedEventIndex,
  ]);

  const allCells = Array.from({ length: totalCells }).map((_, cellIndex) => {
    const dayNum = cellIndex - startDay + 1;
    const visible = dayNum >= 1 && dayNum <= daysInMonth;
    const highlight = hoverCellIndex === cellIndex;

    return (
      <DroppableCell
        key={cellIndex}
        cellIndex={cellIndex}
        highlight={highlight}
        onCellPointerDown={handleCellPointerDown}
        onCellPointerEnter={handleCellPointerEnter}
        onCellPointerUp={handleCellPointerUp}
      >
        <Typography variant="body2">{visible ? dayNum : ""}</Typography>
      </DroppableCell>
    );
  });

  return (
    <>
      {/* <div style={{ textAlign: "left" }}>
        <pre>{JSON.stringify(events, null, 2)}</pre>
        <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
      </div> */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gridTemplateRows: `repeat(${weeksCount}, ${WEEK_ROW_HEIGHT}px)`,
            position: "relative",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            borderLeft: "1px solid rgba(0,0,0,0.06)",
            minWidth: 700,
            userSelect: "none",
          }}
        >
          {allCells}

          {/* Render existing events — while dragging, dim the others */}
          {Array.from(segmentsByWeek.entries()).map(([weekIdx, segments]) =>
            segments.map((seg, i) => {
              const idx = events.indexOf(seg.event);
              const isDimmed =
                draggedEventIndex != null && idx !== draggedEventIndex;

              return (
                <DraggableEvent
                  key={`${weekIdx}-${i}`}
                  seg={seg}
                  id={`event-${idx}`}
                  dimmed={isDimmed}
                  onClick={(e: any) => handleEventClick(e, seg.event)}
                />
              );
            })
          )}

          {/* Render preview segments for drag-to-move */}
          {previewSegments.map((pseg, i) => {
            const leftPct = (pseg.startCol - 1) * (100 / 7);
            const widthPct = (pseg.endCol - pseg.startCol + 1) * (100 / 7);
            const weekIndex = pseg.weekIndex;
            const existingSegs = segmentsByWeek.get(weekIndex) ?? [];

            let nextTrack = 0;
            while (true) {
              const conflict = existingSegs.some(
                (s) =>
                  s.trackIndex === nextTrack &&
                  !(
                    (
                      pseg.endCol < s.startCol || // preview ends before this segment starts
                      pseg.startCol > s.endCol
                    ) // preview starts after this segment ends
                  )
              );
              if (!conflict) break;
              nextTrack++;
            }
            const topPx =
              weekIndex * WEEK_ROW_HEIGHT +
              nextTrack * (TRACK_HEIGHT + TRACK_GAP) +
              TOP_OFFSET__FOR_TASKS;
            return (
              <Box
                key={`preview-${i}`}
                sx={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  top: topPx,
                  height: TRACK_HEIGHT,
                  borderRadius: 6,
                  backgroundColor: "rgba(25,118,210,0.18)",
                  border: "1px dashed rgba(25,118,210,0.6)",
                  zIndex: 900,
                  display: "flex",
                  alignItems: "center",
                  px: 1,
                  pointerEvents: "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontSize: 13, color: "rgba(0,0,0,0.85)" }}
                >
                  {draggedEventIndex != null
                    ? events[draggedEventIndex].label
                    : ""}
                </Typography>
              </Box>
            );
          })}

          {/*  Render preview for drag-to-create */}
          {selectPreview.map((pseg, i) => {
            const leftPct = (pseg.startCol - 1) * (100 / 7);
            const widthPct = (pseg.endCol - pseg.startCol + 1) * (100 / 7);
            const weekIndex = pseg.weekIndex;
            const existingSegs = segmentsByWeek.get(weekIndex) ?? [];

            let nextTrack = 0;
            while (true) {
              const conflict = existingSegs.some(
                (s) =>
                  s.trackIndex === nextTrack &&
                  !(pseg.endCol < s.startCol || pseg.startCol > s.endCol)
              );
              if (!conflict) break;
              nextTrack++;
            }
            const topPx =
              weekIndex * WEEK_ROW_HEIGHT +
              nextTrack * (TRACK_HEIGHT + TRACK_GAP) +
              TOP_OFFSET__FOR_TASKS;

            const isStart =
              pseg.startCol ===
              Math.min(...selectPreview.map((s) => s.startCol));
            const eventColor = " #1976d2";

            return (
              <Box
                key={`select-preview-${i}`}
                sx={{
                  position: "absolute",
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  top: topPx,
                  height: TRACK_HEIGHT,
                  borderRadius: 6,
                  backgroundColor: eventColor,
                  color: "#fff",
                  zIndex: 900,
                  display: "flex",
                  alignItems: "center",
                  px: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  opacity: 0.8,
                  pointerEvents: "none",
                }}
              >
                {isStart && <strong style={{ marginRight: 8, fontSize: 12 }} />}
                <span style={{ fontSize: 13 }}>New Task</span>
              </Box>
            );
          })}
        </Box>
      </DndContext>{" "}
      <TaskModal
        open={openTaskModal}
        selectedEvent={selectedEvent}
        onClose={closeTaskModal}
        onSave={saveEventToMainEventsState}
      />
      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: { borderRadius: 3, boxShadow: 4, minWidth: 200, p: 0, mt: 1 },
          },
        }}
      >
        <Box sx={{ p: 2, position: "relative", pt: 6 }}>
          {/* Top-right action icons */}
          <Box
            sx={{
              position: "absolute",
              top: 12,
              right: 18,
              display: "flex",
              gap: 1,
            }}
          >
            <IconButton size="small" onClick={handleEditEvent}>
              <EditIcon />
            </IconButton>
            <IconButton size="small">
              <DeleteIcon onClick={handleDeleteEvent} />
            </IconButton>
            <IconButton onClick={handlePopoverClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          {/* title */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {popoverEvent?.label || "(No title)"}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {formatDayRange(popoverEvent?.start, popoverEvent?.end)}, July 2025
          </Typography>
          <StatusPill status={popoverEvent?.status || ""} />
        </Box>
      </Popover>
    </>
  );
}
