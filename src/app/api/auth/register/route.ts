import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken, setSessionCookie } from "@/lib/auth";
import { ApiError, toErrorResponse } from "@/lib/errors";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    await connectDB();

    const existing = await User.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await User.create({ email: body.email, passwordHash, name: body.name });

    const token = signToken({ userId: user.id });
    await setSessionCookie(token);

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
