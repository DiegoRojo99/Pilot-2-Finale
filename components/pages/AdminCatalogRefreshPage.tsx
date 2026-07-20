"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";

type RefreshBatchResponse = {
  totalShows: number;
  processedInBatch: number;
  refreshedInBatch: number;
  failedInBatch: number;
  failures: Array<{ tmdbId: number; error: string }>;
  nextCursor: number | null;
  hasMore: boolean;
};

type RunSummary = {
  totalShows: number;
  processed: number;
  refreshed: number;
  failed: number;
  failures: Array<{ tmdbId: number; error: string }>;
};

export default function AdminCatalogRefreshPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const runRefresh = async () => {
    setIsRunning(true);
    setRunError(null);

    let cursor: number | null = 0;
    let keepRunning = true;
    let totalShows = 0;
    let processed = 0;
    let refreshed = 0;
    let failed = 0;
    const failures: Array<{ tmdbId: number; error: string }> = [];

    try {
      while (keepRunning) {
        const response = await fetch("/api/admin/catalog-refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cursor, batch_size: 20 }),
        });

        const data = (await response.json().catch(() => null)) as RefreshBatchResponse | { error?: string } | null;

        if (!response.ok) {
          throw new Error((data as { error?: string } | null)?.error ?? "Catalog refresh request failed");
        }

        const batch = data as RefreshBatchResponse;
        totalShows = batch.totalShows;
        processed += batch.processedInBatch;
        refreshed += batch.refreshedInBatch;
        failed += batch.failedInBatch;

        if (batch.failures.length > 0) {
          failures.push(...batch.failures);
        }

        setSummary({
          totalShows,
          processed,
          refreshed,
          failed,
          failures: [...failures],
        });

        cursor = batch.nextCursor;
        keepRunning = batch.hasMore && cursor !== null;
      }
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unknown refresh error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <PageShell title="Admin Catalog Refresh" showBack>
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-200">
          Hidden admin utility. This refreshes all shows in the DB from TMDB and allows show names to be updated.
        </div>

        <button
          type="button"
          onClick={() => {
            void runRefresh();
          }}
          disabled={isRunning}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
        >
          {isRunning ? "Refreshing all shows..." : "Run Full Catalog Refresh"}
        </button>

        {runError && (
          <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-300">
            {runError}
          </div>
        )}

        {summary && (
          <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <h2 className="text-base font-semibold text-slate-100">Run Summary</h2>
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
              <div>Total shows: {summary.totalShows}</div>
              <div>Processed: {summary.processed}</div>
              <div>Refreshed: {summary.refreshed}</div>
              <div>Failed: {summary.failed}</div>
            </div>

            {summary.failures.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <p className="mb-2 text-sm font-medium text-slate-200">Failures ({summary.failures.length})</p>
                <div className="max-h-56 space-y-1 overflow-auto text-xs text-slate-400">
                  {summary.failures.map((failure) => (
                    <p key={`${failure.tmdbId}-${failure.error}`}>
                      {failure.tmdbId}: {failure.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
