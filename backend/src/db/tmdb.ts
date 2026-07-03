import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: process.env.TMDB_API_KEY,
  },
});

export const getImageUrl = (path: string | null, size: string = 'w500'): string | null => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};
