import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { connectDB } from "./db";
import { User, type UserDocument } from "@/models/User";

const COOKIE_NAME = "session";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days — same accepted MVP shortcut as mobile, no refresh rotation

export interface SessionPayload {
  userId: string;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET env var — copy .env.example to .env and fill it in");
  }
  return secret;
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

// httpOnly means client JS never sees the token — no XSS-exfiltratable
// session, and no Zustand-persisted token needed the way mobile had one.
// See ARCHITECTURE_PLAN.md §1.
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// For Server Components / Route Handlers using the async next/headers API.
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

// For code that already has a NextRequest in hand (e.g. middleware) and
// would rather read the cookie off it directly than call the async
// cookies() API.
export function getSessionUserIdFromRequest(req: NextRequest): string | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

// The single call site every protected Route Handler / Server Component
// uses: throws UnauthorizedError (mapped to 401 by lib/errors.ts) if there's
// no valid session, otherwise returns the loaded user document.
export async function requireUser(): Promise<UserDocument> {
  const userId = await getSessionUserId();
  if (!userId) throw new UnauthorizedError();

  await connectDB();
  const user = await User.findById(userId);
  if (!user) throw new UnauthorizedError();

  return user;
}
