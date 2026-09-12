"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queryClient";

// React Query needs a Client Component boundary — this is the one place
// that boundary starts, wrapping the whole app from the root layout. Using
// useState (not a module-level singleton) means each browser tab gets its
// own client and server-rendered pages never leak cached data across
// requests. See ARCHITECTURE_PLAN.md §1 for why this coexists with Server
// Components rather than replacing them.
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
