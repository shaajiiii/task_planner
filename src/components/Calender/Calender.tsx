import * as React from "react";
import { Box, Typography } from "@mui/material";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragCancelEvent,
} from "@dnd-kit/core";

type CalendarEvent = {
  start: number;
  end: number;
  label: string;
  color?: string;
  time?: string;
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

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month, day).getDay();
}

function splitEventsIntoSegments(
  events: CalendarEvent[],
  daysInMonth: number,
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
}: {
  seg: Segment;
  id: string;
  dimmed?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const leftPct = (seg.startCol - 1) * (100 / 7);
  const widthPct = (seg.endCol - seg.startCol + 1) * (100 / 7);
  const topPx =
    seg.weekIndex * WEEK_ROW_HEIGHT +
    (seg.trackIndex ?? 0) * (TRACK_HEIGHT + TRACK_GAP) +
    30;

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
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      title={`${seg.event.label} (${seg.event.start}-${seg.event.end})`}
    >
      {seg.event.time && seg.isStart && (
        <strong style={{ marginRight: 8, fontSize: 12 }}>
          {seg.event.time}
        </strong>
      )}
      <span style={{ fontSize: 13 }}>{seg.event.label}</span>
    </div>
  );
}

function DroppableCell({
  cellIndex,
  children,
  highlight,
}: {
  cellIndex: number;
  children?: React.ReactNode;
  highlight?: boolean;
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
        backgroundColor: highlight ? "rgba(25,118,210,0.08)" : undefined,
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
    >
      {children}
    </Box>
  );
}

export default function CalendarMonth() {
  const year = 2024;
  const month = 9; // October (0-based)

  const [events, setEvents] = React.useState<CalendarEvent[]>([
    { start: 1, end: 3, label: "Short Trip", color: "#1976d2", time: "4:15pm" },
    { start: 5, end: 10, label: "Workshop", color: "#0b7f08" },
    { start: 3, end: 10, label: "Conference", color: "#525252" },
    { start: 28, end: 31, label: "Quarter End", color: "#f57c00" },
  ]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = getDayOfWeek(year, month, 1);
  const weeksCount = Math.ceil((startDay + daysInMonth) / 7);
  const totalCells = weeksCount * 7;

  const segmentsByWeek = React.useMemo(
    () => splitEventsIntoSegments(events, daysInMonth, startDay),
    [events, daysInMonth, startDay]
  );

  const [draggedEventIndex, setDraggedEventIndex] = React.useState<
    number | null
  >(null);
  const [hoverCellIndex, setHoverCellIndex] = React.useState<number | null>(
    null
  );

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

  const previewSegments = React.useMemo(() => {
    if (draggedEventIndex == null || hoverCellIndex == null) return [];
    const ev = events[draggedEventIndex];
    if (!ev) return [];
    const newDay = hoverCellIndex - startDay + 1;
    if (newDay < 1 || newDay > daysInMonth) return [];
    const duration = ev.end - ev.start + 1;
    return previewSegmentsFor(newDay, duration);
  }, [draggedEventIndex, hoverCellIndex, events, startDay, daysInMonth]);

  const allCells = Array.from({ length: totalCells }).map((_, cellIndex) => {
    const dayNum = cellIndex - startDay + 1;
    const visible = dayNum >= 1 && dayNum <= daysInMonth;
    const highlight = hoverCellIndex === cellIndex;
    return (
      <DroppableCell
        key={cellIndex}
        cellIndex={cellIndex}
        highlight={highlight}
      >
        <Typography variant="body2">{visible ? dayNum : ""}</Typography>
      </DroppableCell>
    );
  });

  return (
    <DndContext
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
        }}
      >
        {allCells}

        {/* Render existing events — while dragging, dim the others */}
        {Array.from(segmentsByWeek.entries()).map(([weekIdx, segments]) =>
          segments.map((seg, i) => {
            const idx = events.indexOf(seg.event);
            if (draggedEventIndex != null && idx === draggedEventIndex) {
              return null; // hide dragged event
            }
            const isDimmed =
              draggedEventIndex != null && idx !== draggedEventIndex;

            return (
              <DraggableEvent
                key={`${weekIdx}-${i}`}
                seg={seg}
                id={`event-${idx}`}
                dimmed={isDimmed}
              />
            );
          })
        )}

        {/* Render preview segments */}
        {previewSegments.map((pseg, i) => {
          const leftPct = (pseg.startCol - 1) * (100 / 7);
          const widthPct = (pseg.endCol - pseg.startCol + 1) * (100 / 7);
          const weekIndex = pseg.weekIndex;
          const existingSegs = segmentsByWeek.get(weekIndex) ?? [];
          const nextTrack =
            existingSegs.length > 0
              ? Math.max(...existingSegs.map((s) => s.trackIndex ?? 0)) + 1
              : 0;
          const topPx =
            weekIndex * WEEK_ROW_HEIGHT +
            nextTrack * (TRACK_HEIGHT + TRACK_GAP);
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
      </Box>
    </DndContext>
  );
}
