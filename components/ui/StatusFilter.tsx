"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { STATUS_LABELS, type ShowStatus } from "@/types";

const STATUS_OPTIONS: ShowStatus[] = ["watching", "want_to_watch", "watched", "on_hold", "dropped"];

type StatusFilterProps = {
  selectedStatus: ShowStatus;
  onStatusChange: (status: ShowStatus) => void;
  fullWidth?: boolean;
};

export function StatusFilter({ selectedStatus, onStatusChange, fullWidth = false }: StatusFilterProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const buttonClasses = fullWidth
    ? "w-full flex items-center justify-between gap-1.5 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-500 active:bg-slate-700 transition-colors"
    : "flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-500 active:bg-slate-700 transition-colors";

  return (
    <div className={fullWidth ? "w-full relative" : "relative"}>
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        className={buttonClasses}
      >
        <span>{STATUS_LABELS[selectedStatus]}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>
      {dropdownOpen && (
        <div className={`absolute z-20 mt-2 overflow-hidden rounded-lg border border-slate-600 bg-slate-700 shadow-xl ${fullWidth ? "left-0 right-0 w-full" : "top-full right-0 min-w-[160px]"}`}>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                onStatusChange(status);
                setDropdownOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                selectedStatus === status
                  ? "bg-blue-500/20 text-blue-300 font-medium"
                  : "text-slate-300 hover:bg-slate-600"
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
