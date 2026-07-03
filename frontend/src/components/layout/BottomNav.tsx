import { NavLink } from 'react-router-dom';
import { Search, Tv, Bookmark, CheckSquare, BarChart2 } from 'lucide-react';

const navItems = [
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/watching', icon: Tv, label: 'Watching' },
  { to: '/watchlist', icon: Bookmark, label: 'Watchlist' },
  { to: '/history', icon: CheckSquare, label: 'History' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 safe-bottom z-50">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2.5 px-2 flex-1 min-w-0 transition-colors ${
                isActive ? 'text-blue-400' : 'text-slate-500 active:text-slate-300'
              }`
            }
          >
            <Icon className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-[10px] font-medium truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
