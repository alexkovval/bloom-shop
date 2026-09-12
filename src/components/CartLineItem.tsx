"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartLineItemData } from "@/features/cart/types";
import { useUpdateCartItem } from "@/features/cart/hooks/useUpdateCartItem";
import { useRemoveCartItem } from "@/features/cart/hooks/useRemoveCartItem";

export function CartLineItem({ item }: { item: CartLineItemData }) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  function handleQuantityChange(next: number) {
    if (next < 1 || next > item.product.stock) return;
    updateItem.mutate({ id: item.id, quantity: next });
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-neutral-200">
      <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-100 rounded-md overflow-hidden">
        <Image src={item.product.imageUrl} alt={item.product.name} fill className="object-cover" />
      </div>
      <div className="flex-1 flex flex-col gap-1">
        <Link href={`/products/${item.product.id}`} className="text-sm font-medium hover:underline">
          {item.product.name}
        </Link>
        <span className="text-sm text-neutral-500">
          ${(item.product.priceCents / 100).toFixed(2)}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={updateItem.isPending}
            className="w-7 h-7 rounded-md border border-neutral-300 text-sm"
          >
            −
          </button>
          <span className="w-6 text-center text-sm">{item.quantity}</span>
          <button
            type="button"
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={updateItem.isPending || item.quantity >= item.product.stock}
            className="w-7 h-7 rounded-md border border-neutral-300 text-sm"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-medium">
          ${((item.product.priceCents * item.quantity) / 100).toFixed(2)}
        </span>
        <button
          type="button"
          onClick={() => removeItem.mutate(item.id)}
          disabled={removeItem.isPending}
          className="text-xs text-neutral-500 hover:text-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
