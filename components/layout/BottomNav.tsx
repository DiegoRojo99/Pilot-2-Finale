"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Bookmark, CheckSquare, Search, Tv } from "lucide-react";

const navItems = [
  { href: "/search", icon: Search, label: "Search" },
  { href: "/watching", icon: Tv, label: "Watching" },
  { href: "/watchlist", icon: Bookmark, label: "Watchlist" },
  { href: "/history", icon: CheckSquare, label: "History" },
  { href: "/stats", icon: BarChart2, label: "Stats" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2.5 transition-colors ${
                isActive ? "text-blue-400" : "text-slate-500 active:text-slate-300"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              <span className="truncate text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
