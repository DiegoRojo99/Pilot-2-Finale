import { Router, Request, Response } from 'express';
import db from '../db/database';

const router = Router();

// Get all episode logs (optionally filtered by show)
router.get('/', (req: Request, res: Response) => {
  const { tmdb_show_id, limit = '50', offset = '0' } = req.query;
  let query: string;
  let params: unknown[];

  if (tmdb_show_id) {
    query = `
      SELECT el.*, us.name as show_name, us.poster_path
      FROM episode_logs el
      JOIN user_shows us ON el.tmdb_show_id = us.tmdb_id
      WHERE el.tmdb_show_id = ?
      ORDER BY el.season_number ASC, el.episode_number ASC
      LIMIT ? OFFSET ?
    `;
    params = [tmdb_show_id, Number(limit), Number(offset)];
  } else {
    query = `
      SELECT el.*, us.name as show_name, us.poster_path
      FROM episode_logs el
      JOIN user_shows us ON el.tmdb_show_id = us.tmdb_id
      ORDER BY el.watched_at DESC
      LIMIT ? OFFSET ?
    `;
    params = [Number(limit), Number(offset)];
  }

  const logs = db.prepare(query).all(...params);
  return res.json(logs);
});

// Get watched episodes for a specific show (set of S01E01 keys)
router.get('/show/:tmdbShowId', (req: Request, res: Response) => {
  const { tmdbShowId } = req.params;
  const logs = db.prepare(`
    SELECT season_number, episode_number, rating, notes, watched_at
    FROM episode_logs
    WHERE tmdb_show_id = ?
    ORDER BY season_number ASC, episode_number ASC
  `).all(tmdbShowId);
  return res.json(logs);
});

// Log a watched episode
router.post('/', (req: Request, res: Response) => {
  const {
    tmdb_show_id,
    season_number,
    episode_number,
    episode_name,
    rating,
    notes,
    watched_at,
  } = req.body;

  if (!tmdb_show_id || season_number === undefined || episode_number === undefined) {
    return res.status(400).json({ error: 'tmdb_show_id, season_number, and episode_number are required' });
  }

  // Verify the show exists in user list
  const show = db.prepare('SELECT id FROM user_shows WHERE tmdb_id = ?').get(tmdb_show_id);
  if (!show) {
    return res.status(404).json({ error: 'Show not in your list. Add it first.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO episode_logs (tmdb_show_id, season_number, episode_number, episode_name, rating, notes, watched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(tmdb_show_id, season_number, episode_number) DO UPDATE SET
        episode_name = excluded.episode_name,
        rating = excluded.rating,
        notes = excluded.notes,
        watched_at = excluded.watched_at
    `);

    stmt.run(
      tmdb_show_id,
      season_number,
      episode_number,
      episode_name ?? null,
      rating ?? null,
      notes ?? null,
      watched_at ?? new Date().toISOString()
    );

    const log = db.prepare(`
      SELECT * FROM episode_logs
      WHERE tmdb_show_id = ? AND season_number = ? AND episode_number = ?
    `).get(tmdb_show_id, season_number, episode_number);

    return res.status(201).json(log);
  } catch (error) {
    console.error('Error logging episode:', error);
    return res.status(500).json({ error: 'Failed to log episode' });
  }
});

// Remove episode log (mark as unwatched)
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM episode_logs WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Episode log not found' });
  }

  return res.json({ success: true });
});

// Remove a specific episode log by show/season/episode
router.delete('/show/:tmdbShowId/season/:season/episode/:episode', (req: Request, res: Response) => {
  const { tmdbShowId, season, episode } = req.params;
  const result = db.prepare(`
    DELETE FROM episode_logs
    WHERE tmdb_show_id = ? AND season_number = ? AND episode_number = ?
  `).run(tmdbShowId, Number(season), Number(episode));

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Episode log not found' });
  }

  return res.json({ success: true });
});

// Get stats for a user
router.get('/stats', (_req: Request, res: Response) => {
  const totalEpisodes = (db.prepare('SELECT COUNT(*) as count FROM episode_logs').get() as { count: number }).count;
  const totalShows = (db.prepare('SELECT COUNT(*) as count FROM user_shows').get() as { count: number }).count;
  const watchingShows = (db.prepare("SELECT COUNT(*) as count FROM user_shows WHERE status = 'watching'").get() as { count: number }).count;
  const watchedShows = (db.prepare("SELECT COUNT(*) as count FROM user_shows WHERE status = 'watched'").get() as { count: number }).count;
  const wantToWatch = (db.prepare("SELECT COUNT(*) as count FROM user_shows WHERE status = 'want_to_watch'").get() as { count: number }).count;

  return res.json({
    totalEpisodes,
    totalShows,
    watchingShows,
    watchedShows,
    wantToWatch,
  });
});

export default router;
