import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { computeTotals } from "@/lib/pricing";
import type { CartData } from "../types";

interface UpdateCartItemInput {
  id: string;
  quantity: number;
}

// Optimistic update + rollback on error, same pattern as the mobile app's
// cart hooks: the quantity stepper feels instant, and a failed request
// (e.g. stock changed server-side) snaps back to the last known-good state
// instead of leaving a stale, wrong number on screen.
export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: UpdateCartItemInput) =>
      apiFetch<CartData>(`/api/cart/items/${id}`, { method: "PATCH", body: { quantity } }),
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<CartData>(["cart"]);
      if (previous) {
        const items = previous.items.map((item) => (item.id === id ? { ...item, quantity } : item));
        const totals = computeTotals(
          items.map((item) => ({ priceCents: item.product.priceCents, quantity: item.quantity }))
        );
        queryClient.setQueryData<CartData>(["cart"], { items, ...totals });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["cart"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
