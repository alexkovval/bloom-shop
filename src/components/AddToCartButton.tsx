"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useAddToCart } from "@/features/cart/hooks/useAddToCart";
import { ApiError } from "@/lib/apiClient";

export function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setMessage(null);
    try {
      await addToCart.mutateAsync({ productId, quantity: 1 });
      setMessage("Added to cart");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?redirectTo=/products/${productId}`);
        return;
      }
      setMessage(err instanceof ApiError ? err.message : "Could not add to cart");
    }
  }

  if (stock === 0) {
    return (
      <Button disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={addToCart.isPending} className="w-full">
        {addToCart.isPending ? "Adding…" : "Add to cart"}
      </Button>
      {message ? <span className="text-sm text-neutral-500">{message}</span> : null}
    </div>
  );
}
