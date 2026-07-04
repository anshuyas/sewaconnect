import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["localhost:3001", "localhost:3000"];

export function middleware(req: NextRequest) {
  const host = req.headers.get("host");

  if (!host || !ALLOWED_HOSTS.includes(host)) {
    return NextResponse.json(
      { error: "Invalid Host header" },
      { status: 400 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};