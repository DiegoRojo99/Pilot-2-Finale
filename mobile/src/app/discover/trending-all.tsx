import { getTrendingShows } from '@/lib/shows';
import { ShowGridPage } from '@/components/pages/show-grid-page';

export default function TrendingAllScreen() {
  return (
    <ShowGridPage
      title="Trending Now"
      loadFn={getTrendingShows}
      errorMessage="Failed to load trending shows"
    />
  );
}
