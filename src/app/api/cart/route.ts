import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CartItem } from "@/models/CartItem";
import { Product } from "@/models/Product";
import { serializeCart } from "@/lib/serializers";
import { ApiError, toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireUser();
    await connectDB();
    return NextResponse.json(await serializeCart(user.id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = addItemSchema.parse(await req.json());
    await connectDB();

    const product = await Product.findById(body.productId);
    if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found");

    const existing = await CartItem.findOne({ userId: user.id, productId: product.id });
    const nextQuantity = (existing?.quantity ?? 0) + body.quantity;
    if (nextQuantity > product.stock) {
      throw new ApiError(409, "OUT_OF_STOCK", `Only ${product.stock} left in stock`);
    }

    if (existing) {
      existing.quantity = nextQuantity;
      await existing.save();
    } else {
      await CartItem.create({ userId: user.id, productId: product.id, quantity: body.quantity });
    }

    return NextResponse.json(await serializeCart(user.id), { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
