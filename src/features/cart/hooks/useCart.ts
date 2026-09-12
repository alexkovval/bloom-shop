import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { CartData } from "../types";

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => apiFetch<CartData>("/api/cart"),
  });
}
