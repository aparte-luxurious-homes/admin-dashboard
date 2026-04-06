'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-zinc-500">An error occurred while loading this page.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#124452] text-white rounded-md hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
