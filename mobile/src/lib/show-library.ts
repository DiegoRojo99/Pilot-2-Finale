import type { UserShow } from '../types/api';

export function getLibraryProgress(show: Pick<UserShow, 'watched_episodes_count' | 'number_of_episodes' | 'next_episode'>) {
  const watched = show.watched_episodes_count;
  const total = show.number_of_episodes;
  if (watched == null || !Number.isFinite(watched) || !Number.isFinite(total)
    || watched <= 0 || total <= 0 || watched >= total) return null;

  const percentage = Math.round(watched / total * 100);
  if (percentage === 0 || percentage === 100) return null;
  const next = show.next_episode;
  const label = next?.has_reliable_next
    ? `S${next.season_number} E${String(next.episode_number).padStart(2, '0')} of ${total}`
    : `${watched} of ${total} episodes watched`;
  return { label, percentage };
}
