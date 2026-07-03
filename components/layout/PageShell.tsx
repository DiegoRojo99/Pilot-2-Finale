"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type PageShellProps = {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
};

export function PageShell({
  title,
  showBack,
  rightAction,
  children,
  noPadding,
}: PageShellProps) {
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      {(title || showBack || rightAction) && (
        <header className="safe-top flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
          {showBack && (
            <button
              type="button"
              onClick={() => router.back()}
              className="-ml-1 flex h-8 w-8 items-center justify-center text-slate-300 active:text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {title && <h1 className="flex-1 truncate text-lg font-bold text-slate-100">{title}</h1>}
          {rightAction && <div className="shrink-0">{rightAction}</div>}
        </header>
      )}
      <main className={`flex-1 overflow-y-auto ${noPadding ? "" : "px-4 py-4"}`}>{children}</main>
    </div>
  );
}
