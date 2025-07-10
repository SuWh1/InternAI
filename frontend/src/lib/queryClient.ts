import { QueryClient } from '@tanstack/react-query';
import { CACHE_LIMITS } from '../utils/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_LIMITS?.STALE_TIME ?? 0,
      gcTime: CACHE_LIMITS?.QUERY_CACHE_TIME ?? 5 * 60 * 1000,
      retry: (failureCount: number, error: any) => {
        if (error && error.statusCode) {
          return error.statusCode !== 401 && failureCount < 3;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
}); 