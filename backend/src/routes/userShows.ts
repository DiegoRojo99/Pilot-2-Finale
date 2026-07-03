import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// Get all user shows (optionally filtered by status)
router.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let query = 'SELECT * FROM user_shows ORDER BY updated_at DESC';
  let params: unknown[] = [];

  if (status && typeof status === 'string') {
    query = 'SELECT * FROM user_shows WHERE status = ? ORDER BY updated_at DESC';
    params = [status];
  }

  const shows = db.prepare(query).all(...params);
  return res.json(shows);
});

// Get single user show
router.get('/:tmdbId', (req: Request, res: Response) => {
  const { tmdbId } = req.params;
  const show = db.prepare('SELECT * FROM user_shows WHERE tmdb_id = ?').get(tmdbId);
  if (!show) {
    return res.status(404).json({ error: 'Show not found in your list' });
  }
  return res.json(show);
});

// Add show to user list
router.post('/', (req: Request, res: Response) => {
  const {
    tmdb_id,
    name,
    poster_path,
    backdrop_path,
    overview,
    first_air_date,
    status = 'watching',
    vote_average,
    number_of_seasons,
    number_of_episodes,
  } = req.body;

  if (!tmdb_id || !name) {
    return res.status(400).json({ error: 'tmdb_id and name are required' });
  }

  const validStatuses = ['watching', 'want_to_watch', 'watched', 'dropped', 'on_hold'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO user_shows (tmdb_id, name, poster_path, backdrop_path, overview, first_air_date, status, vote_average, number_of_seasons, number_of_episodes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tmdb_id) DO UPDATE SET
        name = excluded.name,
        poster_path = excluded.poster_path,
        backdrop_path = excluded.backdrop_path,
        overview = excluded.overview,
        first_air_date = excluded.first_air_date,
        status = excluded.status,
        vote_average = excluded.vote_average,
        number_of_seasons = excluded.number_of_seasons,
        number_of_episodes = excluded.number_of_episodes,
        updated_at = datetime('now')
    `);

    stmt.run(
      tmdb_id, name, poster_path ?? null, backdrop_path ?? null,
      overview ?? null, first_air_date ?? null, status,
      vote_average ?? 0, number_of_seasons ?? 0, number_of_episodes ?? 0
    );

    const show = db.prepare('SELECT * FROM user_shows WHERE tmdb_id = ?').get(tmdb_id);
    return res.status(201).json(show);
  } catch (error) {
    console.error('Error adding show:', error);
    return res.status(500).json({ error: 'Failed to add show' });
  }
});

// Update show status
router.patch('/:tmdbId', (req: Request, res: Response) => {
  const { tmdbId } = req.params;
  const { status } = req.body;

  const validStatuses = ['watching', 'want_to_watch', 'watched', 'dropped', 'on_hold'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare(`
    UPDATE user_shows SET status = ?, updated_at = datetime('now') WHERE tmdb_id = ?
  `).run(status, tmdbId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Show not found in your list' });
  }

  const show = db.prepare('SELECT * FROM user_shows WHERE tmdb_id = ?').get(tmdbId);
  return res.json(show);
});

// Remove show from user list
router.delete('/:tmdbId', (req: Request, res: Response) => {
  const { tmdbId } = req.params;
  const result = db.prepare('DELETE FROM user_shows WHERE tmdb_id = ?').run(tmdbId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Show not found in your list' });
  }

  return res.json({ success: true });
});

export default router;
