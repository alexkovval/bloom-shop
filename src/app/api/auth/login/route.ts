import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken, setSessionCookie } from "@/lib/auth";
import { ApiError, toErrorResponse } from "@/lib/errors";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = loginSchema.parse(await req.json());
    await connectDB();

    const user = await User.findOne({ email: body.email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Incorrect email or password");
    }

    const token = signToken({ userId: user.id });
    await setSessionCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
