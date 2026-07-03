import { Router, Request, Response } from 'express';
import { tmdb } from '../db/tmdb';

const router = Router();

// Search TV shows
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, page = '1' } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const response = await tmdb.get('/search/tv', {
      params: {
        query,
        page,
        include_adult: false,
      },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('TMDB search error:', error);
    return res.status(500).json({ error: 'Failed to search shows' });
  }
});

// Get show details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid show ID' });
    }
    const response = await tmdb.get(`/tv/${id}`, {
      params: {
        append_to_response: 'content_ratings,external_ids',
      },
    });
    return res.json(response.data);
  } catch (error) {
    console.error('TMDB show details error:', error);
    return res.status(500).json({ error: 'Failed to fetch show details' });
  }
});

// Get season details
router.get('/:id/season/:seasonNumber', async (req: Request, res: Response) => {
  try {
    const { id, seasonNumber } = req.params;
    if (!/^\d+$/.test(id) || !/^\d+$/.test(seasonNumber)) {
      return res.status(400).json({ error: 'Invalid show ID or season number' });
    }
    const response = await tmdb.get(`/tv/${id}/season/${seasonNumber}`);
    return res.json(response.data);
  } catch (error) {
    console.error('TMDB season error:', error);
    return res.status(500).json({ error: 'Failed to fetch season details' });
  }
});

// Get popular TV shows
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1' } = req.query;
    const response = await tmdb.get('/tv/popular', {
      params: { page },
    });
    return res.json(response.data);
  } catch (error) {
    console.error('TMDB popular shows error:', error);
    return res.status(500).json({ error: 'Failed to fetch popular shows' });
  }
});

// Get trending TV shows
router.get('/trending/week', async (_req: Request, res: Response) => {
  try {
    const response = await tmdb.get('/trending/tv/week');
    return res.json(response.data);
  } catch (error) {
    console.error('TMDB trending error:', error);
    return res.status(500).json({ error: 'Failed to fetch trending shows' });
  }
});

export default router;
