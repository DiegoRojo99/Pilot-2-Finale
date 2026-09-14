import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function StatsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Insights"
      title="Stats"
      description="A compact view for episode counts, status totals, watch momentum, and progress patterns."
      tasks={[
        'Call /api/episodes/stats with the selected time period.',
        'Design phone-sized stat cards that are easy to read at a glance.',
        'Keep numbers consistent with the web stats page.',
      ]}
    />
  );
}