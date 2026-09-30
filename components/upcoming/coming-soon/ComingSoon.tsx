'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import styles from './styles.module.css';
import { UpcomingEpisodesResponse } from '@/types';

type DaysFilter = 7 | 14 | 30 | 60 | 90;

const DAYS_OPTIONS: DaysFilter[] = [7, 14, 30, 60, 90];

export function ComingSoon() {
  const [selectedDays, setSelectedDays] = useState<DaysFilter>(30);

  const { data, isLoading, error } = useQuery<UpcomingEpisodesResponse>({
    queryKey: ['upcomingEpisodes', selectedDays],
    queryFn: async () => {
      const res = await fetch(`/api/episodes/upcoming?days=${selectedDays}&status=watching`);
      if (!res.ok) throw new Error('Failed to fetch upcoming episodes');
      return res.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load upcoming episodes" />;

  const episodes = data?.episodes ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.filterBar}>
        <label htmlFor="days-filter">Look Ahead:</label>
        <select
          id="days-filter"
          value={selectedDays}
          onChange={(e) => setSelectedDays(Number(e.target.value) as DaysFilter)}
          className={styles.select}
        >
          {DAYS_OPTIONS.map((days) => (
            <option key={days} value={days}>
              Next {days} Days
            </option>
          ))}
        </select>
      </div>

      {episodes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No upcoming episodes in the next {selectedDays} days</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {episodes.map((episode) => {
            const backdropUrl = episode.showBackdropPath
              ? `https://image.tmdb.org/t/p/w780${episode.showBackdropPath}`
              : undefined;
            const posterUrl = episode.showPosterPath
              ? `https://image.tmdb.org/t/p/w342${episode.showPosterPath}`
              : undefined;
            const airDate = new Date(episode.airDate);

            return (
              <div key={`${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`} className={styles.card}>
                <div className={styles.backdrop}>
                  {backdropUrl ? (
                    <img src={backdropUrl} alt={episode.showName} className={styles.backdropImg} />
                  ) : (
                    <div className={styles.backdropPlaceholder} />
                  )}
                  <div className={styles.backdropOverlay} />
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.posterSection}>
                    {posterUrl ? (
                      <img src={posterUrl} alt={episode.showName} className={styles.poster} />
                    ) : (
                      <div className={styles.posterPlaceholder} />
                    )}
                    <div className={styles.episodeBadge}>
                      S{String(episode.seasonNumber).padStart(2, '0')}E
                      {String(episode.episodeNumber).padStart(2, '0')}
                    </div>
                  </div>

                  <div className={styles.info}>
                    <h3 className={styles.showName}>{episode.showName}</h3>
                    <p className={styles.episodeTitle}>{episode.title}</p>
                    <div className={styles.airDateLabel}>
                      {airDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    {episode.overview && <p className={styles.overview}>{episode.overview}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {episodes.length > 0 && (
        <div className={styles.summary}>
          <p>
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''} in the next {selectedDays} days
          </p>
        </div>
      )}
    </div>
  );
}
