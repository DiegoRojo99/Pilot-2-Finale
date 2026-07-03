"use client";

import { AlertCircle } from "lucide-react";

type ErrorMessageProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorMessage({ message = "Something went wrong", onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-slate-400">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-center text-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm transition-colors hover:bg-slate-600"
        >
          Try again
        </button>
      )}
    </div>
  );
}
