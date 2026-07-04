import { NextRequest, NextResponse } from "next/server";
import { generateOAuthState } from "@/lib/auth/oauthState";

export async function GET(req: NextRequest) {
  const state = generateOAuthState();

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI as string,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set("oauthState", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // "lax" needed here since Google redirects back cross-site
    path: "/",
    maxAge: 60 * 10, // 10 minutes — this is a short-lived flow
  });

  return response;
}