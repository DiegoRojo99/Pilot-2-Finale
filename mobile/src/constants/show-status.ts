import type { ShowStatus } from '@/types/api';

export const SHOW_STATUS_COLORS: Record<ShowStatus, { backgroundColor: string; color: string }> = {
  watching: { backgroundColor: 'rgba(96, 165, 250, 0.1)', color: 'rgb(96, 165, 250)' },
  want_to_watch: { backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'rgb(139, 92, 246)' },
  watched: { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'rgb(34, 197, 94)' },
  dropped: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' },
  on_hold: { backgroundColor: 'rgba(250, 204, 21, 0.1)', color: 'rgb(250, 204, 21)' },
};
