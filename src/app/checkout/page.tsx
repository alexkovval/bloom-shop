"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useCart } from "@/features/cart/hooks/useCart";
import { useCreateOrder, type OrderData } from "@/features/checkout/hooks/useCreateOrder";
import { checkoutSchema, type CheckoutInput } from "@/features/checkout/validation/checkoutSchemas";
import { ApiError } from "@/lib/apiClient";

export default function CheckoutPage() {
  const { data: cart } = useCart();
  const createOrder = useCreateOrder();
  const [placedOrder, setPlacedOrder] = useState<OrderData | null>(null);

  // Generated once per checkout attempt (not per submit) and reused on
  // every retry within it — layer 2 of the three-layer idempotency guard.
  // Layer 1 is the submit-disabled state below; layer 3 (the unique index
  // + transaction) lives in the API route. See ARCHITECTURE_PLAN.md §4.
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema) });

  async function onSubmit(input: CheckoutInput) {
    try {
      // input.expiry was only for client-side validation above — the
      // server never sees the full card number or expiry, only the last 4
      // digits (see ARCHITECTURE_PLAN.md §1/§4), so it's built explicitly
      // here rather than destructured-and-discarded.
      const { order } = await createOrder.mutateAsync({
        idempotencyKey,
        shippingInfo: {
          fullName: input.fullName,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
        },
        cardLast4: input.cardNumber.slice(-4),
      });
      setPlacedOrder(order);
    } catch (err) {
      setError("root", {
        message: err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      });
    }
  }

  if (placedOrder) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-semibold">Order placed!</h1>
        <p className="text-neutral-600">
          Thanks, {placedOrder.shippingInfo.fullName}. Your total was $
          {(placedOrder.totalCents / 100).toFixed(2)}.
        </p>
        <Link href={`/orders/${placedOrder.id}`}>
          <Button>View order</Button>
        </Link>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center flex flex-col gap-3 items-center">
        <p className="text-neutral-600">Your cart is empty.</p>
        <Link href="/shop" className="underline text-sm">
          Go shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      <div className="flex justify-between text-sm bg-neutral-50 rounded-md px-4 py-3 mb-6">
        <span className="text-neutral-500">
          {cart.items.length} item{cart.items.length === 1 ? "" : "s"}
        </span>
        <span className="font-medium">${(cart.totalCents / 100).toFixed(2)} total</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Shipping</h2>
        <TextField label="Full name" {...register("fullName")} error={errors.fullName?.message} />
        <TextField
          label="Address line 1"
          {...register("addressLine1")}
          error={errors.addressLine1?.message}
        />
        <TextField label="Address line 2 (optional)" {...register("addressLine2")} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="City" {...register("city")} error={errors.city?.message} />
          <TextField label="State" {...register("state")} error={errors.state?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Postal code"
            {...register("postalCode")}
            error={errors.postalCode?.message}
          />
          <TextField label="Country" {...register("country")} error={errors.country?.message} />
        </div>

        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mt-4">
          Payment
        </h2>
        <p className="text-xs text-neutral-400 -mt-2">
          Manual entry only — this demo never stores your full card number, only the last 4 digits.
        </p>
        <TextField
          label="Card number"
          placeholder="4242 4242 4242 4242"
          {...register("cardNumber")}
          error={errors.cardNumber?.message}
        />
        <TextField
          label="Expiry (MM/YY)"
          placeholder="12/28"
          {...register("expiry")}
          error={errors.expiry?.message}
        />

        {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}

        <Button type="submit" disabled={isSubmitting || createOrder.isPending} className="mt-2">
          {isSubmitting || createOrder.isPending ? "Placing order…" : "Place order"}
        </Button>
      </form>
    </main>
  );
}
