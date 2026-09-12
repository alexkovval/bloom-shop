"use client";

import Link from "next/link";
import { useCart } from "@/features/cart/hooks/useCart";
import { CartLineItem } from "@/components/CartLineItem";
import { Button } from "@/components/Button";

// Client Component: quantity steppers, remove, live subtotal — genuinely
// interactive, so this is the one cart-related page that isn't a Server
// Component. See ARCHITECTURE_PLAN.md §1.
export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();

  if (isLoading) {
    return <main className="mx-auto max-w-2xl px-6 py-10">Loading cart…</main>;
  }

  if (isError) {
    return <main className="mx-auto max-w-2xl px-6 py-10">Could not load your cart.</main>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/shop">
          <Button>Continue shopping</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Your cart</h1>
      <div>
        {cart.items.map((item) => (
          <CartLineItem key={item.id} item={item} />
        ))}
      </div>
      <div className="flex flex-col gap-2 pt-6 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>${(cart.subtotalCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Tax</span>
          <span>${(cart.taxCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Shipping</span>
          <span>${(cart.shippingCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
          <span>Total</span>
          <span>${(cart.totalCents / 100).toFixed(2)}</span>
        </div>
      </div>
      <Link href="/checkout" className="block mt-6">
        <Button className="w-full">Proceed to checkout</Button>
      </Link>
    </main>
  );
}
