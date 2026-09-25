"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { EpisodeLog } from "@/types";
import { Film, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { episodeKey, getBackdropUrl } from "@/lib/utils";

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

function renderStars(rating: number | null | undefined): string {
  if (!rating || rating <= 0) return "";
  const starsRating = rating / 2;
  const clampedRating = Math.min(Math.max(starsRating, 0), 5);
  const fullStars = Math.floor(clampedRating);
  const hasHalf = clampedRating % 1 >= 0.5;

  let stars = "★".repeat(fullStars);
  if (hasHalf) stars += "☆";

  const emptyCount = Math.max(0, 5 - Math.ceil(starsRating));
  stars += "☆".repeat(emptyCount);

  return stars;
}

export default function DiaryDayEntry({ group, deletingLogId, onEdit, onDelete }: DiaryDayEntryProps) {
  return (
    <>
        {/* Date Separator */}
        <h3 className="text-base font-bold text-slate-100">{group.label}</h3>

        {/* Entries */}
        <div className="space-y-2 pb-4">
            {group.logs.map((log) => (
                <DiaryEntryCard
                    key={log.id}
                    log={log}
                    isDeleting={deletingLogId === log.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    </>
  );
}

function DiaryEntryCard({
  log,
  isDeleting,
  onEdit,
  onDelete,
}: {
  log: EpisodeLog;
  isDeleting: boolean;
  onEdit: (log: EpisodeLog) => void;
  onDelete: (log: EpisodeLog) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const still = log.still_path ? getBackdropUrl(log.still_path) : null;
  const stars = renderStars(log.rating);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  return (
    <Link
      href={`/show/${log.tmdb_show_id}/season/${log.season_number}/episode/${log.episode_number}`}
      className="group relative block"
      onClick={(e) => {
        if (showMenu) e.preventDefault();
      }}
    >
      <div ref={cardRef} className="relative rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all overflow-visible">
        {/* Menu Button - Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded hover:bg-slate-700/50 transition-colors"
          aria-label="Menu"
        >
          <MoreVertical className="h-4 w-4 text-slate-400" />
        </button>

        {/* Menu Dropdown */}
        {showMenu && (
          <div className="absolute top-8 right-2 z-30 bg-slate-700 rounded-lg shadow-lg border border-slate-600 overflow-hidden min-w-max">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(false);
                onEdit(log);
              }}
              className="w-full px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 flex items-center gap-2 transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (isDeleting) return;
                const shouldDelete = window.confirm("Delete this watch log?");
                if (!shouldDelete) return;
                setShowMenu(false);
                onDelete(log);
              }}
              disabled={isDeleting}
              className="w-full px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex gap-0">
          {/* Still Image */}
          <div className="shrink-0 overflow-hidden">
            {still ? (
              <Image
                src={still}
                alt={log.episode_name || "Episode still"}
                width={104}
                height={96}
                className="h-24 w-[104px] object-cover rounded-l-xl"
              />
            ) : (
              <div className="flex h-24 w-[104px] items-center justify-center bg-slate-800 rounded-l-xl">
                <Film className="h-5 w-5 text-slate-600" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex flex-1 flex-col justify-start gap-1 px-3 py-2 sm:px-4 pr-10 min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-100">
              {log.episode_name || `Episode ${log.episode_number}`}
            </h4>

            <div className="flex items-center gap-1 min-w-0">
              <p className="truncate text-xs font-medium text-slate-400">
                {log.show_name}
              </p>
              <span className="text-xs text-slate-500">·</span>
              <p className="truncate text-xs font-medium text-slate-400">
                {episodeKey(log.season_number, log.episode_number)}
              </p>
            </div>

            {stars && (
              <p className="text-xs font-medium text-yellow-400">
                {stars} {log.rating?.toFixed(1)}/10
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}