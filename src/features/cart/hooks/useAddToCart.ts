import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { CartData } from "../types";

interface AddToCartInput {
  productId: string;
  quantity: number;
}

// No optimistic update here: unlike update/remove (below), "add" doesn't
// already have the target line in the cart cache to merge against, and
// the calling page (product detail) shows its own pending/success state
// on the button — the cart list itself catches up via setQueryData below
// as soon as the response lands.
export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddToCartInput) =>
      apiFetch<CartData>("/api/cart", { method: "POST", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });
}
