import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { CartData } from "../types";

// `enabled` lets callers (e.g. NavBar) skip firing this query at all for a
// signed-out visitor — /api/cart requires auth, so querying unconditionally
// there would just fire a guaranteed 401 on every page.
export function useCart(enabled = true) {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartData>("/api/cart"),
    enabled,
  });
}
