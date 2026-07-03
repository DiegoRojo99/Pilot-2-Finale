"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Tv } from "lucide-react";
import { getMyShows } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { UserShowCard } from "@/components/show/ShowCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { STATUS_LABELS, type ShowStatus } from "@/types";

const STATUS_OPTIONS: ShowStatus[] = ["watching", "want_to_watch", "watched", "on_hold", "dropped"];

export default function WatchingPage() {
  const [selectedStatus, setSelectedStatus] = useState<ShowStatus>("watching");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-shows", selectedStatus],
    queryFn: () => getMyShows(selectedStatus),
    staleTime: 30_000,
  });

  const statusMessages: Record<ShowStatus, string> = {
    watching: "No shows being watched. Search and add some!",
    want_to_watch: "No shows on your watchlist yet.",
    watched: "No watched shows yet.",
    on_hold: "No shows on hold.",
    dropped: "No dropped shows.",
  };

  return (
    <PageShell
      title="My Shows"
      rightAction={
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 active:bg-slate-600"
          >
            {STATUS_LABELS[selectedStatus]}
            <ChevronDown className="h-4 w-4" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(status);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    selectedStatus === status
                      ? "bg-blue-400/10 text-blue-400"
                      : "text-slate-300 hover:bg-slate-700/50"
                  }`}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          )}
        </div>
      }
    >
      {isLoading && <PageLoader />}
      {error && <ErrorMessage message="Failed to load shows" onRetry={() => void refetch()} />}
      {data && (
        <>
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <Tv className="h-12 w-12 opacity-30" />
              <p className="text-center text-sm">{statusMessages[selectedStatus]}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.map((show) => (
                <UserShowCard key={show.tmdb_id} show={show} />
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
