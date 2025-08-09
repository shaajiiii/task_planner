// CalendarMonth.tsx
import React, { useMemo, type FC } from "react";
import { Box, Typography } from "@mui/material";

type CalendarEvent = {
  start: number; // day of month (1..)
  end: number; // day of month (1..)
  label: string;
  color?: string;
  time?: string;
};

type Segment = {
  weekIndex: number;
  startCol: number; // 1..7
  endCol: number; // 1..7 (inclusive)
  event: CalendarEvent;
  isStart: boolean;
  isEnd: boolean;
  trackIndex?: number; // filled after track assignment
};

const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Example inputs - replace with dynamic date logic as needed
 */
const daysInMonth = 31;
const startDay = 1; // 0 = Sunday, 1 = Monday ... (the weekday index of day 1 of the month)

const events: CalendarEvent[] = [
  { start: 1, end: 3, label: "Short Trip", color: "#1976d2", time: "4:15pm" },
  { start: 5, end: 10, label: "Workshop", color: "#0b7f08" },
  { start: 3, end: 10, label: "Workshop", color: "#525252ff" },
  { start: 28, end: 31, label: "Quarter End", color: "#f57c00" },
];

const CalendarMonth: FC = () => {
// export default function CalendarMonth(): JSX.Element {
  // total cells = weeks * 7
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const weeksCount = totalCells / 7;

  /**
   * Convert events -> weekly segments. Then assign tracks per week so segments that overlap are stacked.
   */
  const segmentsByWeek = useMemo(() => {
    const segsMap = new Map<number, Segment[]>();

    // Helper to push segment into map
    const pushSeg = (s: Segment) => {
      const arr = segsMap.get(s.weekIndex) ?? [];
      arr.push(s);
      segsMap.set(s.weekIndex, arr);
    };

    // Convert each event to one or more weekly segments
    events.forEach((ev) => {
      // convert day -> absolute cell index (0-based) in the month grid
      // cellIndex for day d = startDay + (d - 1)
      const startCell = startDay + ev.start - 1;
      const endCell = startDay + ev.end - 1;

      let cur = startCell;
      while (cur <= endCell) {
        const weekIndex = Math.floor(cur / 7);
        const weekLastCell = weekIndex * 7 + 6;

        const segStartCell = cur;
        const segEndCell = Math.min(endCell, weekLastCell);

        const startCol = (segStartCell % 7) + 1; // 1..7
        const endCol = (segEndCell % 7) + 1; // 1..7 inclusive

        pushSeg({
          weekIndex,
          startCol,
          endCol,
          event: ev,
          isStart: segStartCell === startCell,
          isEnd: segEndCell === endCell,
        });

        cur = segEndCell + 1;
      }
    });

    // Assign vertical tracks per week so overlapping segments stack
    for (const [weekIndex, segs] of segsMap) {
      // sort by startCol ascending, longer first maybe, stable
      segs.sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol);

      const tracks: Segment[][] = [];

      segs.forEach((seg) => {
        let placed = false;
        for (let t = 0; t < tracks.length; t++) {
          const last = tracks[t][tracks[t].length - 1];
          // no overlap if last.endCol < seg.startCol
          if (last.endCol < seg.startCol) {
            seg.trackIndex = t;
            tracks[t].push(seg);
            placed = true;
            break;
          }
        }
        if (!placed) {
          seg.trackIndex = tracks.length;
          tracks.push([seg]);
        }
      });

      // replace with updated segs (trackIndex set)
      segsMap.set(weekIndex, segs);
    }

    return segsMap; // Map<weekIndex, Segment[]>
  }, [events]);

  // Styling constants for layout
  const WEEK_ROW_HEIGHT = 110; // px - height of each week row (days + room for events)
  const DAY_NUMBER_HEIGHT = 22; // top area reserved for the day number
  const TRACK_HEIGHT = 34; // px height per event track
  const TRACK_GAP = 6; // px gap between tracks

  // Render weeks (each week is position:relative container)
  return (
    <Box sx={{ p: 3 }}>
      {/* week headers */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          mb: 1.5,
          px: 1,
        }}
      >
        {daysOfWeek.map((d) => (
          <Typography
            key={d}
            sx={{ fontWeight: 700, textAlign: "center", letterSpacing: 0.6 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Weeks column */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {Array.from({ length: weeksCount }).map((_, weekIdx) => {
          // build day cells for this week
          const dayCells = Array.from({ length: 7 }).map((__, colIdx) => {
            const cellIndex = weekIdx * 7 + colIdx;
            const dayNum = cellIndex - startDay + 1;
            const visible = dayNum >= 1 && dayNum <= daysInMonth;
            return { dayNum: visible ? dayNum : null, cellIndex };
          });

          // segments for this week (may be undefined)
          const segsThisWeek = segmentsByWeek.get(weekIdx) ?? [];
          const maxTracks = segsThisWeek.length
            ? Math.max(...segsThisWeek.map((s) => s.trackIndex ?? 0)) + 1
            : 0;

          // compute overlay height for tracks
          const overlayHeight = maxTracks
            ? maxTracks * TRACK_HEIGHT +
              Math.max(0, (maxTracks - 1) * TRACK_GAP)
            : 0;

          return (
            <Box
              key={weekIdx}
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                minHeight: WEEK_ROW_HEIGHT,
                borderTop: "1px solid rgba(0,0,0,0.06)",
                borderLeft: "1px solid rgba(0,0,0,0.06)",
                position: "relative",
                px: 1,
              }}
            >
              {/* day cells */}
              {dayCells.map((cell, ci) => (
                <Box
                  key={ci}
                  sx={{
                    borderRight: "1px solid rgba(0,0,0,0.06)",
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    px: 1,
                    pt: 1,
                    boxSizing: "border-box",
                    // reserve space at top for day number
                    minHeight: WEEK_ROW_HEIGHT,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: 13,
                      color: "#222",
                      lineHeight: "20px",
                      height: DAY_NUMBER_HEIGHT,
                    }}
                  >
                    {cell.dayNum ?? ""}
                  </Typography>
                </Box>
              ))}

              {/* events overlay for this week */}
              {segsThisWeek.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    // place overlay just below day numbers (so events don't cover the number)
                    top: DAY_NUMBER_HEIGHT + 6,
                    height: overlayHeight,
                    pointerEvents: "auto",
                    zIndex: 5,
                  }}
                >
                  {/* render each segment */}
                  {segsThisWeek.map((seg, i) => {
                    const track = seg.trackIndex ?? 0;
                    const leftPercent = ((seg.startCol - 1) / 7) * 100;
                    const widthPercent =
                      ((seg.endCol - seg.startCol + 1) / 7) * 100;
                    const topPx = track * (TRACK_HEIGHT + TRACK_GAP);

                    // rounded corners only at actual start/end of event (not when segment continues)
                    const borderTopLeftRadius = seg.isStart ? 8 : 2;
                    const borderBottomLeftRadius = seg.isStart ? 8 : 2;
                    const borderTopRightRadius = seg.isEnd ? 8 : 2;
                    const borderBottomRightRadius = seg.isEnd ? 8 : 2;

                    return (
                      <Box
                        key={i}
                        sx={{
                          position: "absolute",
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          top: topPx,
                          height: TRACK_HEIGHT,
                          backgroundColor: seg.event.color ?? "#1976d2",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          px: 1.25,
                          boxSizing: "border-box",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          borderTopLeftRadius,
                          borderBottomLeftRadius,
                          borderTopRightRadius,
                          borderBottomRightRadius,
                          boxShadow: "0 1px 0 rgba(0,0,0,0.06) inset",
                        }}
                        title={`${seg.event.label} (${seg.event.start}→${seg.event.end})`}
                      >
                        {seg.event.time && seg.isStart && (
                          <strong style={{ marginRight: 8, fontSize: 12 }}>
                            {seg.event.time}
                          </strong>
                        )}
                        <span style={{ fontSize: 13 }}>{seg.event.label}</span>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default CalendarMonth