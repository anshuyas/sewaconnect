import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { signPasswordResetToken } from "@/lib/auth/passwordResetToken";
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimiter";
import { verifyTotpToken } from "@/lib/auth/mfa";
import { decryptField } from "@/lib/crypto/encryption";
import { sanitizeInput } from "@/lib/validation/sanitize";
import { generateCsrfToken } from "@/lib/auth/csrf";
import { verifyRecaptcha } from "@/lib/auth/recaptcha";
import { logAudit } from "@/lib/auth/auditLog";
import { isPasswordExpired } from "@/lib/auth/passwordPolicy";

const MAX_FAILED_ATTEMPTS = 12;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaToken: z.string().length(6).optional(),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit("login", ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
    { error: rateLimit.reason === "blocked"
        ? "Your IP has been temporarily blocked due to suspicious activity."
        : "Too many login attempts. Please try again later." },
    {
      status: rateLimit.reason === "blocked" ? 403 : 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    }
  );
}

  try {
    const body = sanitizeInput(await req.json());
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password, mfaToken, recaptchaToken } = parsed.data;

    if (!mfaToken) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: "CAPTCHA verification required" },
          { status: 400 }
        );
      }
      const recaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaValid) {
        return NextResponse.json(
          { error: "CAPTCHA verification failed" },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const user = await User.findOne({ email }).select(
      "+passwordHash +mfaSecret +passwordHistory"
    );

    const genericError = NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );

    if (!user) return genericError;

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Please log in with Google." },
        { status: 400 }
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const retryAfterSeconds = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: "Account temporarily locked due to repeated failed logins." },
        { status: 423, headers: { "Retry-After": String(retryAfterSeconds) } }
      );
    }

    const passwordValid = await verifyPassword(user.passwordHash, password);

    if (!passwordValid) {
      user.failedLoginAttempts += 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        await logAudit("account_locked", { email }, user._id.toString(), ip);
        user.failedLoginAttempts = 0;
      }

      await user.save();
      await logAudit("login_failed", { email }, undefined, ip);
      return genericError;
    }

    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      await user.save();
    }

    if (user.mfaEnabled) {
      if (!mfaToken) {
        return NextResponse.json(
          { mfaRequired: true, message: "MFA code required" },
          { status: 200 }
        );
      }

      const secret = decryptField(user.mfaSecret as string);
      const validCode = verifyTotpToken(mfaToken, secret);

      if (!validCode) {
        return NextResponse.json({ error: "Invalid MFA code" }, { status: 401 });
      }
    }

    if (isPasswordExpired(user.passwordChangedAt)) {
      const resetToken = signPasswordResetToken(user._id.toString());
      await logAudit("password_expired_login_blocked", {}, user._id.toString(), ip);
      return NextResponse.json(
        {
          error: "Your password has expired. Please set a new password to continue.",
          passwordExpired: true,
          resetToken,
        },
        { status: 403 }
      );
    }

    const jti = randomUUID();
    const payload = { userId: user._id.toString(), role: user.role, jti };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const csrfToken = generateCsrfToken();

    const response = NextResponse.json({ message: "Login successful" });

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

    await logAudit("login_success", {}, user._id.toString(), ip);
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}