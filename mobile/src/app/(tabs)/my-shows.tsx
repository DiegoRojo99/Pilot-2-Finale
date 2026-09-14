import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function MyShowsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Library"
      title="My Shows"
      description="Your saved shows will live here, grouped by watching status so the next episode is easy to find."
      tasks={[
        'Load saved shows from the existing /api/my-shows endpoint.',
        'Add status filters for Watching, Want to Watch, Watched, On Hold, and Dropped.',
        'Show progress and the next episode for each active show.',
      ]}
    />
  );
}