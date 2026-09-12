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
  return orders.map(serializeOrder);
}

export async function getOrderForUser(userId: string, orderId: string) {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, userId });
  return order ? serializeOrder(order) : null;
}
