"use client";

import { useEffect, useState } from "react";

export function EpisodeDiaryModal({
  isOpen,
  episodeLabel,
  isPending,
  title = "Log Episode Watch",
  submitLabel = "Save",
  defaultWatchedAt = null,
  defaultRating = null,
  onSubmit,
  onCancel,
}: {
  isOpen: boolean;
  episodeLabel: string;
  isPending: boolean;
  title?: string;
  submitLabel?: string;
  defaultWatchedAt?: string | null;
  defaultRating?: number | null;
  onSubmit: (payload: { watchedAt: string | null; rating: number | null }) => void;
  onCancel: () => void;
}) {
  const [watchedDate, setWatchedDate] = useState("");
  const [ratingInput, setRatingInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setWatchedDate(defaultWatchedAt ? defaultWatchedAt.slice(0, 10) : "");
    setRatingInput(defaultRating === null || defaultRating === undefined ? "" : String(defaultRating));
    setError(null);
  }, [defaultRating, defaultWatchedAt, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-800 p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{episodeLabel}</p>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Watched date (optional)</span>
            <input
              type="date"
              value={watchedDate}
              onChange={(event) => setWatchedDate(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Rating (optional)</span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={ratingInput}
              onChange={(event) => setRatingInput(event.target.value)}
              placeholder="e.g. 8"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              if (isPending) return;
              setError(null);
              setWatchedDate("");
              setRatingInput("");
              onCancel();
            }}
            disabled={isPending}
            className="flex-1 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 active:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const parsedRating = ratingInput.trim() === "" ? null : Number(ratingInput);
              const isValidNumber = parsedRating === null || (Number.isFinite(parsedRating) && parsedRating >= 0 && parsedRating <= 10);
              if (isValidNumber) setError(null);
              else {
                setError("Rating must be between 0 and 10.");
                return;
              }

              const wasWatchedToday = watchedDate && new Date(watchedDate).toDateString() === new Date().toDateString();
              const watchedAt = wasWatchedToday ? new Date().toISOString() : watchedDate ? new Date(`${watchedDate}T12:00:00Z`).toISOString() : null;

              onSubmit({
                watchedAt,
                rating: parsedRating,
              });

              setWatchedDate("");
              setRatingInput("");
            }}
            disabled={isPending}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}