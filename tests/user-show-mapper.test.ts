import assert from 'node:assert/strict';
import test from 'node:test';
import { mapUserShow } from '../lib/mappers/user-show';
import type { UserShowWithShowRow } from '../types/show';

test('library responses include genres and watched counts alongside show metadata', () => {
  const row: UserShowWithShowRow = {
    id: 1,
    tmdbId: 10,
    status: 'watching',
    remainingEpisodesCount: 6,
    watchedEpisodesCount: 4,
    addedAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    show: {
      name: 'Example',
      posterPath: null,
      backdropPath: null,
      overview: null,
      firstAirDate: '2020-01-01',
      voteAverage: 8,
      numberOfSeasons: 2,
      numberOfEpisodes: 10,
      showGenres: [{ genre: { id: 18, name: 'Drama' } }],
    },
  };
  const result = mapUserShow(row);
  assert.deepEqual(result.genres, [{ id: 18, name: 'Drama' }]);
  assert.equal(result.watched_episodes_count, 4);
  assert.equal(result.number_of_episodes, 10);
  assert.equal(result.number_of_seasons, 2);
});
