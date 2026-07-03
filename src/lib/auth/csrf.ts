import { randomBytes } from "crypto";
import { NextRequest } from "next/server";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export function verifyCsrfToken(req: NextRequest): boolean {
  const cookieToken = req.cookies.get("csrfToken")?.value;
  const headerToken = req.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) return false;

  return cookieToken === headerToken;
}