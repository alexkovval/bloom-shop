import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getProductById } from "@/lib/queries";
import { ApiError, toErrorResponse } from "@/lib/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, "NOT_FOUND", "Product not found");
    }

    const product = await getProductById(id);
    if (!product) throw new ApiError(404, "NOT_FOUND", "Product not found");

    return NextResponse.json({ product });
  } catch (err) {
    return toErrorResponse(err);
  }
}
