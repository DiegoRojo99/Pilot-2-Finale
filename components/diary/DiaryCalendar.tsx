"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { EpisodeLog } from "@/types";

interface DiaryCalendarProps {
  logs: EpisodeLog[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export function DiaryCalendar({
  logs,
  selectedDate,
  onSelectDate,
}: DiaryCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Build a map of dates to episode counts
  const logsByDate = useMemo(() => {
    const map = new Map<string, EpisodeLog[]>();
    for (const log of logs) {
      if (!log.watched_at) continue;
      const dateKey = log.watched_at.slice(0, 10);
      const existing = map.get(dateKey) ?? [];
      existing.push(log);
      map.set(dateKey, existing);
    }
    return map;
  }, [logs]);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month and number of days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: (typeof calendarDay)[] = [];

    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateKey: "",
      });
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dateKey = dateObj.toISOString().split("T")[0];
      days.push({
        day: i,
        isCurrentMonth: true,
        dateKey,
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateKey: "",
      });
    }

    return days;
  }, [currentMonth]);

  const monthYear = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  type CalendarDay = typeof calendarDay;
  const calendarDay = { day: 0, isCurrentMonth: false, dateKey: "" };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 mb-2">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="rounded-lg p-2 hover:bg-slate-800"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{monthYear}</h2>
        <button
          onClick={handleNextMonth}
          className="rounded-lg p-2 hover:bg-slate-800"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayObj, idx) => {
          const episodeCount = dayObj.isCurrentMonth
            ? logsByDate.get(dayObj.dateKey)?.length ?? 0
            : 0;
          const isSelected = selectedDate === dayObj.dateKey;
          const hasLogs = episodeCount > 0;

          return (
            <button
              key={idx}
              onClick={() => {
                if (dayObj.isCurrentMonth && dayObj.dateKey) {
                  onSelectDate(isSelected ? null : dayObj.dateKey);
                }
              }}
              className={`
                relative aspect-square rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  !dayObj.isCurrentMonth
                    ? "text-slate-700 cursor-default"
                    : isSelected
                      ? "bg-cyan-600 text-white"
                      : hasLogs
                        ? "bg-slate-800 text-white hover:bg-slate-700"
                        : "text-slate-400 hover:bg-slate-800"
                }
              `}
              disabled={!dayObj.isCurrentMonth}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div>{dayObj.day}</div>
                {hasLogs && (
                  <div className="text-xs mt-0.5">
                    {episodeCount > 9 ? "9+" : episodeCount}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => onSelectDate(null)}
          className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium hover:bg-slate-700"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
