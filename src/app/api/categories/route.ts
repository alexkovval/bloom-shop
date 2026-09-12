import { NextResponse } from "next/server";
import { CATEGORIES } from "@/models/Product";

export async function GET() {
  return NextResponse.json({ categories: CATEGORIES });
}
