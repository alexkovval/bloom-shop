import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/models/CartItem";
import { Product, type ProductDocument } from "@/models/Product";
import { Order, type OrderDocument } from "@/models/Order";
import { computeTotals } from "@/lib/pricing";
import { serializeOrder } from "@/lib/serializers";
import { listOrdersForUser } from "@/lib/queries";
import { ApiError, toErrorResponse } from "@/lib/errors";

const shippingInfoSchema = z.object({
  fullName: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

// Only the last 4 digits are ever sent here — the full card number/expiry
// are Luhn/expiry-validated client-side and never leave the browser. See
// ARCHITECTURE_PLAN.md §1/§4.
const createOrderSchema = z.object({
  shippingInfo: shippingInfoSchema,
  cardLast4: z.string().regex(/^\d{4}$/, "cardLast4 must be exactly 4 digits"),
});

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

// The centerpiece: idempotent order creation. Three-layer guard per
// ARCHITECTURE_PLAN.md §4 — this endpoint is layer 3, the one that actually
// holds under a race (the UI-disable and single-generated-key layers live
// in the checkout page, built in a later phase).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      throw new ApiError(400, "MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required");
    }

    const body = createOrderSchema.parse(await req.json());
    await connectDB();

    // Replay: this exact attempt already succeeded — return the same order
    // without touching the cart or stock again. This is what makes a
    // double-tap or a retried request after a dropped response safe.
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      return NextResponse.json({ order: serializeOrder(existingOrder) }, { status: 200 });
    }

    const session = await mongoose.startSession();
    try {
      let createdOrder: OrderDocument | null = null;

      await session.withTransaction(async () => {
        const cartItems = await CartItem.find({ userId: user.id })
          .populate<{ productId: ProductDocument }>("productId")
          .session(session);

        const validItems = cartItems.filter((item) => item.productId);
        if (validItems.length === 0) {
          throw new ApiError(400, "EMPTY_CART", "Your cart is empty");
        }

        for (const item of validItems) {
          if (item.quantity > item.productId.stock) {
            throw new ApiError(
              409,
              "OUT_OF_STOCK",
              `${item.productId.name} only has ${item.productId.stock} left in stock`
            );
          }
        }

        const orderItems = validItems.map((item) => ({
          productId: item.productId._id,
          nameSnapshot: item.productId.name,
          priceSnapshotCents: item.productId.priceCents,
          quantity: item.quantity,
        }));

        const totals = computeTotals(
          orderItems.map((oi) => ({ priceCents: oi.priceSnapshotCents, quantity: oi.quantity }))
        );

        const [order] = await Order.create(
          [
            {
              userId: user.id,
              status: "placed",
              items: orderItems,
              shippingInfo: body.shippingInfo,
              cardLast4: body.cardLast4,
              ...totals,
              idempotencyKey,
            },
          ],
          { session }
        );

        for (const item of validItems) {
          await Product.updateOne(
            { _id: item.productId._id },
            { $inc: { stock: -item.quantity } },
            { session }
          );
        }

        await CartItem.deleteMany({ userId: user.id }).session(session);

        createdOrder = order;
      });

      if (!createdOrder) {
        // withTransaction only resolves without throwing once the callback
        // above has run to completion (and it always sets createdOrder
        // before returning) — this is an unreachable type-narrowing guard,
        // not a real runtime path.
        throw new ApiError(500, "INTERNAL_ERROR", "Order creation failed");
      }

      return NextResponse.json({ order: serializeOrder(createdOrder) }, { status: 201 });
    } catch (err) {
      // A concurrent duplicate submission can lose the findOne-above race
      // and hit the unique index on idempotencyKey instead (Mongo error
      // code 11000). Treat that the same as a replay — fetch and return
      // whichever attempt won, rather than surfacing a 500 for what is
      // actually a successful, already-placed order.
      if (isDuplicateKeyError(err)) {
        const winner = await Order.findOne({ idempotencyKey });
        if (winner) {
          return NextResponse.json({ order: serializeOrder(winner) }, { status: 200 });
        }
      }
      throw err;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await listOrdersForUser(user.id);
    return NextResponse.json({ orders });
  } catch (err) {
    return toErrorResponse(err);
  }
}
