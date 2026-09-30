'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import styles from './UpcomingEpisodesPage.module.css';
import { UpcomingEpisodesResponse } from '@/types';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';

type SortBy = 'date' | 'show';
type DaysFilter = 7 | 14 | 30 | 60 | 90;

const STATUS_OPTIONS = [
  { value: '', label: 'All Shows' },
  { value: 'watching', label: 'Watching' },
  { value: 'want_to_watch', label: 'Want to Watch' },
  { value: 'on_hold', label: 'On Hold' },
];

const DAYS_OPTIONS: DaysFilter[] = [7, 14, 30, 60, 90];

export default function UpcomingEpisodesPage() {
  const [selectedStatus, setSelectedStatus] = useState('watching');
  const [selectedDays, setSelectedDays] = useState<DaysFilter>(30);
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const queryParams = new URLSearchParams();
  queryParams.set('days', selectedDays.toString());
  if (selectedStatus) queryParams.set('status', selectedStatus);
  queryParams.set('sortBy', sortBy);

  const { data, isLoading, error } = useQuery<UpcomingEpisodesResponse>({
    queryKey: ['upcomingEpisodes', selectedStatus, selectedDays, sortBy],
    queryFn: async () => {
      const res = await fetch(`/api/episodes/upcoming?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch upcoming episodes');
      return res.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load upcoming episodes" />;

  const episodes = data?.episodes ?? [];

  return (
    <div className={styles.container}>
      <h1>Upcoming Episodes</h1>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="status-filter">Show Status</label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.select}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="days-filter">Look Ahead</label>
          <select
            id="days-filter"
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value) as DaysFilter)}
            className={styles.select}
          >
            {DAYS_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days} Days
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sort-filter">Sort By</label>
          <select
            id="sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={styles.select}
          >
            <option value="date">Air Date</option>
            <option value="show">Show Name</option>
          </select>
        </div>
      </div>

      {/* Episodes List */}
      {episodes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No upcoming episodes in the next {selectedDays} days</p>
        </div>
      ) : (
        <div className={styles.episodesList}>
          <div className={styles.header}>
            <div className={styles.colShowDate}>Air Date</div>
            <div className={styles.colShow}>Show</div>
            <div className={styles.colEpisode}>Episode</div>
            <div className={styles.colTitle}>Title</div>
          </div>

          {episodes.map((episode) => (
            <div key={`${episode.showId}-${episode.seasonNumber}-${episode.episodeNumber}`} className={styles.episodeRow}>
              <div className={styles.colShowDate}>
                {new Date(episode.airDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className={styles.colShow}>{episode.showName}</div>
              <div className={styles.colEpisode}>
                S{episode.seasonNumber.toString().padStart(2, '0')}E
                {episode.episodeNumber.toString().padStart(2, '0')}
              </div>
              <div className={styles.colTitle}>{episode.title}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.stats}>
        <p>
          {episodes.length} episode{episodes.length !== 1 ? 's' : ''} in the next {selectedDays} days
        </p>
      </div>
    </div>
  );
}
