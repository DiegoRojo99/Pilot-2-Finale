import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BottomNav } from './components/layout/BottomNav';
import { PageLoader } from './components/ui/LoadingSpinner';

const SearchPage = lazy(() => import('./pages/SearchPage'));
const WatchingPage = lazy(() => import('./pages/WatchingPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ShowDetailPage = lazy(() => import('./pages/ShowDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* App shell: full-height viewport */}
        <div className="flex flex-col h-full max-w-lg mx-auto bg-slate-900">
          {/* Page area: fills space above bottom nav */}
          <div className="flex-1 overflow-hidden pb-[calc(56px+env(safe-area-inset-bottom,0px))]">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/watching" replace />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/watching" element={<WatchingPage />} />
                <Route path="/watchlist" element={<WatchlistPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/show/:id" element={<ShowDetailPage />} />
              </Routes>
            </Suspense>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
