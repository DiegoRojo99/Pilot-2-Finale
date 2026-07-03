import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message = 'Something went wrong', onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-400">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-sm text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
