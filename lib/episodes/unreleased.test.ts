import assert from 'node:assert/strict';
import test from 'node:test';
import { isUpcomingAirDate } from './unreleased';

test('upcoming air dates include today only when requested', () => {
  const today = new Date('2026-11-16T23:30:00Z');
  assert.equal(isUpcomingAirDate('2026-11-15', today, true), false);
  assert.equal(isUpcomingAirDate('2026-11-16', today, false), false);
  assert.equal(isUpcomingAirDate('2026-11-16', today, true), true);
  assert.equal(isUpcomingAirDate('2026-11-17', today, false), true);
});

test('upcoming air dates exclude missing and invalid dates', () => {
  const today = new Date('2026-11-16T00:00:00Z');
  assert.equal(isUpcomingAirDate(null, today, true), false);
  assert.equal(isUpcomingAirDate('not-a-date', today, true), false);
});
