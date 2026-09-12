import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/queries";
import { toErrorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const result = await listProducts({
      search: searchParams.get("search")?.trim() || undefined,
      category: searchParams.get("category")?.trim() || undefined,
      page: Number(searchParams.get("page")) || undefined,
      limit: Number(searchParams.get("limit")) || undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
