import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

export interface ShippingInfo {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderInput {
  idempotencyKey: string;
  shippingInfo: ShippingInfo;
  cardLast4: string;
}

export interface OrderData {
  id: string;
  status: string;
  items: Array<{ productId: string; name: string; priceCents: number; quantity: number }>;
  shippingInfo: ShippingInfo;
  cardLast4: string;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
}

interface OrderResponse {
  order: OrderData;
}

// The client half of the idempotency guard's three layers
// (ARCHITECTURE_PLAN.md §4): the caller generates ONE key per checkout
// attempt and passes it in on every call (including a manual retry after a
// network failure) — React Query's own `mutations.retry: false` default
// (queryClient.ts) is what keeps this from being silently retried with a
// fresh, different key.
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idempotencyKey, ...body }: CreateOrderInput) =>
      apiFetch<OrderResponse>("/api/orders", {
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    onSuccess: () => {
      // The order endpoint clears the server-side cart as part of its
      // transaction — drop the now-stale cached cart.
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}
