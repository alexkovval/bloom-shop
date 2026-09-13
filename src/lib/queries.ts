// Shared product-lookup logic used by BOTH the SSR shop/product pages
// (which query MongoDB directly per ARCHITECTURE_PLAN.md §1) and the
// /api/products Route Handlers (which the client re-fetches from when
// filtering interactively without a full page reload). Keeping the query
// building in one place means those two call sites can't drift apart.
import type { FilterQuery } from "mongoose";
import { connectDB } from "./db";
import { Product, CATEGORIES, type ProductDocument } from "@/models/Product";
import { Order } from "@/models/Order";
import { serializeProduct, serializeOrder } from "./serializers";

export interface ListProductsParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function listProducts(params: ListProductsParams) {
  await connectDB();

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));

  const query: FilterQuery<ProductDocument> = {};
  if (params.search) query.$text = { $search: params.search };
  if (params.category && (CATEGORIES as readonly string[]).includes(params.category)) {
    query.category = params.category as ProductDocument["category"];
  }

  const [docs, total] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(query),
  ]);

  return {
    items: docs.map(serializeProduct),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductById(id: string) {
  await connectDB();
  const doc = await Product.findById(id);
  return doc ? serializeProduct(doc) : null;
}

// Same reuse rationale as the product queries above: both the /orders
// Server Component pages and the /api/orders Route Handlers (used by the
// checkout page's mutation) need "list/get one order for this user" —
// order CREATION stays its own thing in api/orders/route.ts, since that
// path is a transaction with business rules, not a plain read.
export async function listOrdersForUser(userId: string) {
  await connectDB();
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  return attachProductImages(orders.map(serializeOrder));
}

export async function getOrderForUser(userId: string, orderId: string) {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) return null;
  const [withImage] = await attachProductImages([serializeOrder(order)]);
  return withImage;
}

type OrderWithoutImages = ReturnType<typeof serializeOrder>;

// Order.items only ever snapshots name/price/quantity (see Order.ts and
// ARCHITECTURE_PLAN.md §3/§4 — the point of a snapshot is that it never
// changes even if the product does), so there's no imageUrl to embed
// there. Rather than add one — which would mean a schema migration and
// would still leave every already-placed order with no photo — this just
// looks up each item's CURRENT product photo for display. If a product is
// later deleted, imageUrl comes back null and the UI falls back to a
// placeholder; that's a display nicety, not something the order total or
// history depends on.
async function attachProductImages(orders: OrderWithoutImages[]) {
  const ids = Array.from(new Set(orders.flatMap((order) => order.items.map((item) => item.productId))));
  // Both branches must return the same shape (items carrying imageUrl) —
  // otherwise TS infers the union of both return types and widens
  // order.items back to the no-imageUrl shape at every call site.
  if (ids.length === 0) {
    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({ ...item, imageUrl: null as string | null })),
    }));
  }

  const products = await Product.find({ _id: { $in: ids } }, { imageUrl: 1 });
  const imageByProductId = new Map(products.map((p) => [p.id as string, p.imageUrl as string]));

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      imageUrl: imageByProductId.get(item.productId) ?? null,
    })),
  }));
}
