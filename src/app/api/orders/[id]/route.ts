import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireUser } from "@/lib/auth";
import { getOrderForUser } from "@/lib/queries";
import { ApiError, toErrorResponse } from "@/lib/errors";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(404, "NOT_FOUND", "Order not found");
    }

    const order = await getOrderForUser(user.id, id);
    if (!order) throw new ApiError(404, "NOT_FOUND", "Order not found");

    return NextResponse.json({ order });
  } catch (err) {
    return toErrorResponse(err);
  }
}
