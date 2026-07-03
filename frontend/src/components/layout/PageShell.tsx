import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageShellProps {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}

export function PageShell({ title, showBack, rightAction, children, noPadding }: PageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {(title || showBack || rightAction) && (
        <header className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex-shrink-0 safe-top">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center -ml-1 text-slate-300 active:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {title && (
            <h1 className="flex-1 font-bold text-lg text-slate-100 truncate">{title}</h1>
          )}
          {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
        </header>
      )}
      <main className={`flex-1 overflow-y-auto ${noPadding ? '' : 'px-4 py-4'}`}>
        {children}
      </main>
    </div>
  );
}
