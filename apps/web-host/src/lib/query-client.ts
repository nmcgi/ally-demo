import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: (failureCount, error) => {
          // Don't retry auth errors
          if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof (error as { response?: { status?: number } }).response?.status === 'number' &&
            [401, 403, 404].includes((error as { response: { status: number } }).response.status)
          ) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}
