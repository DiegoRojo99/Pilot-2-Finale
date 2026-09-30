import { useQuery } from '@tanstack/react-query';
import { getMyShows } from '@/lib/api';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import styles from './styles.module.css';

export function NextToWatch() {
  const { data: shows, isLoading, error } = useQuery({
    queryKey: ['my-shows', 'watching'],
    queryFn: () => getMyShows('watching'),
    staleTime: 30_000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load shows" />;

  const showsWithNextEpisode = (shows ?? []).filter(
    (show) => show.next_episode?.episode_number && show.next_episode.episode_number > 0
  );

  if (showsWithNextEpisode.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No shows currently watching, or all episodes are caught up!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {showsWithNextEpisode.map((show) => {
          const posterUrl = show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : undefined;
          const nextEp = show.next_episode;

          return (
            <a key={show.tmdb_id} href={`/show/${show.tmdb_id}`} className={styles.card}>
              <div className={styles.cardImage}>
                {posterUrl ? (
                  <img src={posterUrl} alt={show.name} className={styles.poster} />
                ) : (
                  <div className={styles.placeholderPoster}>No Image</div>
                )}
                {nextEp && (
                  <div className={styles.badge}>
                    S{String(nextEp.season_number).padStart(2, '0')}E
                    {String(nextEp.episode_number).padStart(2, '0')}
                  </div>
                )}
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.showName}>{show.name}</h3>
                {nextEp && <p className={styles.episodeInfo}>{nextEp.episode_name || `Episode ${nextEp.episode_number}`}</p>}
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${((show.number_of_episodes - show.remaining_episodes_count) / Math.max(show.number_of_episodes, 1)) * 100}%`,
                    }}
                  />
                </div>
                <p className={styles.progressText}>
                  {show.number_of_episodes - show.remaining_episodes_count} / {show.number_of_episodes} watched
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
