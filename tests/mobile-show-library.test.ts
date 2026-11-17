import assert from 'node:assert/strict';
import test from 'node:test';
import { getLibraryProgress } from '../mobile/src/lib/show-library';

test('library progress uses watched count for percentage and next episode for the label', () => {
  const progress = getLibraryProgress({
    watched_episodes_count: 54,
    number_of_episodes: 122,
    next_episode: {
      tmdb_episode_id: 1,
      season_number: 3,
      episode_number: 5,
      episode_name: 'Next episode',
      has_reliable_next: true,
    },
  });
  assert.deepEqual(progress, { label: 'S3 E05 of 122', percentage: 44 });
});

test('library progress hides the entire section for endpoints and missing counts', () => {
  for (const watched of [undefined, 0, 122, 150, NaN]) {
    assert.equal(getLibraryProgress({ watched_episodes_count: watched, number_of_episodes: 122 }), null);
  }
  assert.equal(getLibraryProgress({ watched_episodes_count: 3, number_of_episodes: 0 }), null);
});

test('library progress does not invent an episode when next episode is unavailable or unreliable', () => {
  const show = { watched_episodes_count: 5, number_of_episodes: 20 };
  assert.deepEqual(getLibraryProgress(show), { label: '5 of 20 episodes watched', percentage: 25 });
  assert.deepEqual(getLibraryProgress({
    ...show,
    next_episode: {
      tmdb_episode_id: null,
      season_number: 1,
      episode_number: 1,
      episode_name: null,
      has_reliable_next: false,
    },
  }), { label: '5 of 20 episodes watched', percentage: 25 });
});
