// Shared response-shaping helpers. Route Handlers in the App Router can
// only export the recognized HTTP-method functions (GET/POST/etc, plus a
// few route config options) — anything else exported from a route.ts file
// is a build-time error, so these helpers live here instead of being
// exported from one route file and imported by another.
import type { ProductDocument } from "@/models/Product";
import { CartItem } from "@/models/CartItem";
import { computeTotals } from "@/lib/pricing";
import type { OrderDocument } from "@/models/Order";

export function serializeProduct(p: ProductDocument) {
  return {
    id: p.id as string,
    name: p.name,
    description: p.description,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    category: p.category,
    stock: p.stock,
  };
}

export async function serializeCart(userId: string) {
  const items = await CartItem.find({ userId }).populate<{ productId: ProductDocument }>(
    "productId"
  );

  // A cart line can point at a product that was deleted after being added —
  // guard against it rather than letting the whole cart response 500.
  const lineItems = items
    .filter((item) => item.productId)
    .map((item) => ({
      id: item.id as string,
      quantity: item.quantity,
      product: serializeProduct(item.productId),
    }));

  const totals = computeTotals(
    lineItems.map((li) => ({ priceCents: li.product.priceCents, quantity: li.quantity }))
  );

  return { items: lineItems, ...totals };
}

export function serializeOrder(order: OrderDocument) {
  return {
    id: order.id as string,
    status: order.status,
    items: order.items.map((item) => ({
      productId: item.productId.toString(),
      name: item.nameSnapshot,
      priceCents: item.priceSnapshotCents,
      quantity: item.quantity,
    })),
    shippingInfo: order.shippingInfo,
    cardLast4: order.cardLast4,
    subtotalCents: order.subtotalCents,
    taxCents: order.taxCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt,
  };
}
