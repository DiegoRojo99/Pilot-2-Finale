import { getTrendingShows } from '@/lib/shows';
import { ShowGridPage } from '@/components/pages/show-grid-page';

export default function TrendingAllScreen() {
  return (
    <ShowGridPage
      title="Trending Now"
      loadFn={(page) => getTrendingShows(page)}
      errorMessage="Failed to load trending shows"
    />
  );
}
