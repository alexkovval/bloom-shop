import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/models/CartItem";
import { Product } from "@/models/Product";
import { serializeCart } from "@/lib/serializers";
import { ApiError, toErrorResponse } from "@/lib/errors";

const updateSchema = z.object({ quantity: z.number().int().min(1) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    await connectDB();

    const item = await CartItem.findOne({ _id: id, userId: user.id });
    if (!item) throw new ApiError(404, "NOT_FOUND", "Cart item not found");

    const product = await Product.findById(item.productId);
    if (!product) throw new ApiError(404, "NOT_FOUND", "Product no longer available");
    if (body.quantity > product.stock) {
      throw new ApiError(409, "OUT_OF_STOCK", `Only ${product.stock} left in stock`);
    }

    item.quantity = body.quantity;
    await item.save();

    return NextResponse.json(await serializeCart(user.id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectDB();

    await CartItem.deleteOne({ _id: id, userId: user.id });

    return NextResponse.json(await serializeCart(user.id));
  } catch (err) {
    return toErrorResponse(err);
  }
}
