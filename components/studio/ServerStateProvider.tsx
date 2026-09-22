'use client';

/**
 * Server state for the whole /projects tree (spec §38).
 *
 * One QueryClient above both the projects list and the workbench, so a project created on the list
 * is already in cache when the workbench opens, and a wallet switch invalidates both at once.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { subscribeSession } from '@/lib/studio/api/session';

export function ServerStateProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Observed chain/runtime state must never be served indefinitely from cache as if it
            // were current; pages re-read and show the backend's own freshness.
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  /* A different wallet is a different user: every cached read belongs to someone else now. */
  useEffect(() => subscribeSession(() => void queryClient.invalidateQueries()), [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
