import { QueryClient } from "@tanstack/react-query";

// One QueryClient instance per browser tab (created inside Providers, a
// Client Component, so this factory runs client-side — see providers.tsx).
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
      mutations: {
        // Route Handlers here are not all safely retryable (see the
        // idempotency guard's own layer-1 UI rule) — callers that need a
        // retry (checkout) opt into it explicitly via the Idempotency-Key
        // header, not via React Query's generic mutation retry.
        retry: false,
      },
    },
  });
}
