import type { UpcomingEpisode } from '../types/episode';

export function groupCalendarEpisodes(episodes: UpcomingEpisode[], month: string, selectedDate: string | null) {
  const groups = new Map<string, UpcomingEpisode[]>();
  for (const episode of episodes) {
    const date = episode.airDate.slice(0, 10);
    if (!date.startsWith(`${month}-`)) continue;
    const group = groups.get(date) ?? [];
    group.push(episode);
    groups.set(date, group);
  }
  if (selectedDate?.startsWith(`${month}-`) && !groups.has(selectedDate)) {
    groups.set(selectedDate, []);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => ({
      date,
      episodes: entries.sort((a, b) => a.showName.localeCompare(b.showName)
        || a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber),
    }));
}
