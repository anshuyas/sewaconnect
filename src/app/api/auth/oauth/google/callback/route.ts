import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { generateCsrfToken } from "@/lib/auth/csrf";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState = req.cookies.get("oauthState")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    // Exchange the authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET as string,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI as string,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json({ error: "OAuth token exchange failed" }, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    // Fetch the user's profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Failed to fetch Google profile" }, { status: 400 });
    }

    const profile = await profileRes.json();
    // profile: { email, name, picture, email_verified, ... }

    if (!profile.email_verified) {
      return NextResponse.json({ error: "Google email not verified" }, { status: 400 });
    }

    await connectDB();

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      // New user via Google — always created as "customer", same as
      // regular registration; role escalation still isn't possible here.
      user = await User.create({
        email: profile.email,
        name: profile.name || profile.email,
        role: "customer",
        authProvider: "google",
        isVerified: true, // Google already verified their email
      });
    }

    const jti = randomUUID();
    const payload = { userId: user._id.toString(), role: user.role, jti };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const csrfToken = generateCsrfToken();

    const response = NextResponse.redirect(new URL("/dashboard", req.url));

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 15,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set("csrfToken", csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 15,
    });

    response.cookies.delete("oauthState");

    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.json({ error: "OAuth login failed" }, { status: 500 });
  }
}