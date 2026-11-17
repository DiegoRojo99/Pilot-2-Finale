import assert from 'node:assert/strict';
import test from 'node:test';
import { groupCalendarEpisodes } from '../mobile/src/lib/calendar';
import type { UpcomingEpisode } from '../mobile/src/types/episode';

function episode(id: number, airDate: string, episodeNumber = 1): UpcomingEpisode {
  return {
    id,
    airDate,
    episodeNumber,
    seasonNumber: 1,
    showId: 10,
    showName: 'Example Show',
    showPosterPath: null,
    showBackdropPath: null,
    title: 'Episode title',
    overview: null,
    stillPath: null,
    userShowStatus: 'watching',
  };
}

test('calendar groups episodes by date, orders batches, and excludes other months', () => {
  const episodes = [
    episode(1, '2026-11-20'),
    episode(2, '2026-11-18', 2),
    episode(3, '2026-12-01'),
    episode(4, '2026-11-18', 1),
  ];
  const groups = groupCalendarEpisodes(episodes, '2026-11', null);
  assert.deepEqual(groups.map((group) => [group.date, group.episodes.map((entry) => entry.id)]), [
    ['2026-11-18', [4, 2]],
    ['2026-11-20', [1]],
  ]);
  assert.deepEqual(episodes.map((entry) => entry.id), [1, 2, 3, 4]);
});

test('selecting an empty day adds an agenda target without hiding scheduled days', () => {
  const episodes = [episode(1, '2026-11-20')];
  const groups = groupCalendarEpisodes(episodes, '2026-11', '2026-11-19');
  assert.deepEqual(groups.map((group) => [group.date, group.episodes.length]), [
    ['2026-11-19', 0],
    ['2026-11-20', 1],
  ]);
  assert.equal(groupCalendarEpisodes(episodes, '2026-11', '2026-11-20').length, 1);
  assert.equal(groupCalendarEpisodes(episodes, '2026-11', '2026-12-01').length, 1);
});
