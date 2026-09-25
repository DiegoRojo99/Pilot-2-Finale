"use client";

import Image from "next/image";
import Link from "next/link";
import { EpisodeLog } from "@/types";
import { CalendarDays, Film, PencilLine, Trash2 } from "lucide-react";
import { episodeKey, formatDate, getPosterUrl } from "@/lib/utils";
import { RatingBadge } from "@/components/ui/RatingBadge";

type DiaryDayEntryProps = {
  group: {
    groupKey: string;
    label: string;
    logs: EpisodeLog[];
  };
  deletingLogId: number | null;
  onEdit: (log: EpisodeLog) => void;
  onDelete: (log: EpisodeLog) => void;
};

export default function DiaryDayEntry({ group, deletingLogId, onEdit, onDelete }: DiaryDayEntryProps) {
  return (
    <section key={group.groupKey} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-100">{group.label}</h3>
        </div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          {group.logs.length} {group.logs.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="divide-y divide-slate-800/80">
        {group.logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <DiaryLogEntry log={log} />

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="flex shrink-0 flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                <p className="text-xs text-slate-500">{log.watched_at ? formatDate(log.watched_at) : "No date"}</p>
                {log.rating !== null && log.rating !== undefined ? <RatingBadge rating={log.rating} size="sm" /> : <span className="text-xs text-slate-600">Unrated</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(log)}
                  aria-label="Edit watch log"
                  title="Edit watch log"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-200 active:bg-slate-600"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(log)}
                  disabled={deletingLogId === log.id}
                  aria-label="Delete watch log"
                  title="Delete watch log"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-300 active:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiaryLogEntry({log}: {log: EpisodeLog}) {
    return (
        <Link
            href={`/show/${log.tmdb_show_id}/season/${log.season_number}/episode/${log.episode_number}`}
            className="group flex min-w-0 flex-1 items-start gap-3"
        >
            <div className="shrink-0 self-start overflow-hidden rounded-lg bg-slate-800">
            {log.poster_path ? (
                <Image
                src={getPosterUrl(log.poster_path, "w185")}
                alt={log.show_name ?? "Poster"}
                width={44}
                height={66}
                className="h-[66px] w-[44px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
            ) : (
                <div className="flex h-[66px] w-[44px] items-center justify-center bg-slate-800 text-slate-500">
                <Film className="h-4 w-4" />
                </div>
            )}
            </div>

            <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold text-slate-500">
                {episodeKey(log.season_number, log.episode_number).replace("E", " E")}
            </p>
            <h4 className="mt-1 truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-blue-300">
                {log.episode_name || `Episode ${log.episode_number}`}
            </h4>
            <p className="mt-1 truncate text-xs text-slate-400">{log.show_name ?? "Unknown show"}</p>
            </div>
        </Link>
    )
}