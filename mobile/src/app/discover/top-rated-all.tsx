import { getTopRatedShows } from '@/lib/shows';
import { ShowGridPage } from '@/components/pages/show-grid-page';

export default function TopRatedAllScreen() {
  return (
    <ShowGridPage
      title="Top Rated"
      loadFn={(page) => getTopRatedShows(page)}
      errorMessage="Failed to load top rated shows"
    />
  );
}
