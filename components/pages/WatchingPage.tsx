"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tv, Clock } from "lucide-react";
import { getMyShows } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import { UserShowCard } from "@/components/show/ShowCard";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { type UpcomingEpisodesResponse } from "@/types";
import styles from "./WatchingPage.module.css";

type TabType = "shows" | "coming";

export default function WatchingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("shows");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-shows"],
    queryFn: () => getMyShows("watching"),
    staleTime: 30_000,
  });

  const { data: upcomingData, isLoading: upcomingLoading, error: upcomingError } = useQuery<UpcomingEpisodesResponse>({
    queryKey: ["upcomingEpisodes"],
    queryFn: async () => {
      const res = await fetch(`/api/episodes/upcoming?status=watching`);
      if (!res.ok) throw new Error("Failed to fetch upcoming episodes");
      return res.json();
    },
  });

  return (
    <PageShell title="Watching">
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "shows" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("shows")}
        >
          <Tv className="h-4 w-4" />
          <span>My Shows</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === "coming" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("coming")}
        >
          <Clock className="h-4 w-4" />
          <span>Coming Soon</span>
        </button>
      </div>

      {/* My Shows Tab */}
      {activeTab === "shows" && (
        <>
          {isLoading && <PageLoader />}
          {error && <ErrorMessage message="Failed to load shows" onRetry={() => void refetch()} />}
          {data && (
            <>
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                  <Tv className="h-12 w-12 opacity-30" />
                  <p className="text-center text-sm">No shows being watched. Search and add some!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {data.map((show) => (
                    <UserShowCard
                      key={show.tmdb_id}
                      show={show}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Coming Soon Tab */}
      {activeTab === "coming" && (
        <>
          {upcomingLoading && <PageLoader />}
          {upcomingError && <ErrorMessage message="Failed to load upcoming episodes" />}
          {upcomingData && (
            <>
              {upcomingData.episodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                  <Tv className="h-12 w-12 opacity-30" />
                  <p className="text-center text-sm">No upcoming episodes</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {upcomingData.episodes.reduce((groups, episode) => {
                    const dateKey = episode.airDate;
                    const existing = groups.find(g => g.date === dateKey);
                    if (existing) {
                      existing.episodes.push(episode);
                    } else {
                      groups.push({ date: dateKey, episodes: [episode] });
                    }
                    return groups;
                  }, [] as { date: string; episodes: typeof upcomingData.episodes }[]).map((group) => {
                    const groupDate = new Date(group.date);
                    const dateLabel = groupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                    return (
                      <div key={group.date} className={styles.dateGroup}>
                        <div className={styles.dateLabel}>{dateLabel}</div>
                        <div className={styles.episodesList}>
                          {group.episodes.map((episode) => {
                            const posterUrl = episode.showPosterPath
                              ? `https://image.tmdb.org/t/p/w185${episode.showPosterPath}`
                              : undefined;

                            return (
                              <div
                                key={`${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`}
                                className={styles.episodeRow}
                              >
                                {posterUrl ? (
                                  <img
                                    src={posterUrl}
                                    alt={episode.showName}
                                    className={styles.episodePoster}
                                  />
                                ) : (
                                  <div className={styles.episodePosterPlaceholder} />
                                )}
                                <div className={styles.episodeRowContent}>
                                  <h3 className={styles.episodeRowShowName}>{episode.showName}</h3>
                                  <div className={styles.episodeRowMeta}>
                                    <span className={styles.episodeRowLabel}>
                                      S{String(episode.seasonNumber).padStart(2, '0')} E
                                      {String(episode.episodeNumber).padStart(2, '0')}
                                    </span>
                                  </div>
                                  {episode.title && (
                                    <p className={styles.episodeRowTitle}>{episode.title}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
