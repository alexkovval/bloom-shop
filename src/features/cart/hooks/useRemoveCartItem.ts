import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import { computeTotals } from "@/lib/pricing";
import type { CartData } from "../types";

// Same optimistic-update-then-rollback shape as useUpdateCartItem.
export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiFetch<CartData>(`/api/cart/items/${id}`, { method: "DELETE" }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<CartData>(["cart"]);
      if (previous) {
        const items = previous.items.filter((item) => item.id !== id);
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
