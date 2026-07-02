import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";

export interface SessionUser {
  userId: string;
  role: string;
  jti: string;
}

export function getSessionUser(req: NextRequest): SessionUser | null {
  const token = req.cookies.get("accessToken")?.value;
  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}