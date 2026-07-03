import { NextRequest, NextResponse } from "next/server";
import { verifyCsrfToken } from "@/lib/auth/csrf";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  response.cookies.delete("csrfToken");

  return response;
}