/**
 * React Query Configuration for OverInsur Data Platform
 * 
 * Centralized query client configuration with optimal caching strategy
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Global query client with production settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Consider data fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Retry count: Attempt up to 3 times on failure
      retry: 3,
      
      // Retry delay: Exponential backoff (starting at 1s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch only on window focus when relevant
      refetchOnWindowFocus: (query) => {
        const isCritical = ['translations', 'versions'].some(critical =>
          query.queryKey?.[0]?.toString().includes(critical)
        );
        return isCritical;
      },
      
      throwOnError: false,
    },
    mutations: {
      // Network runtime
      networkMode: 'online',
    },
  },
});

/**
 * Query devtools config for development environment
 */
export const isDev = import.meta.env.DEV;
