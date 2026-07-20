import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { hashPassword, verifyPassword, isPasswordReused } from "@/lib/auth/password";
import { validatePasswordStrength, PASSWORD_HISTORY_SIZE } from "@/lib/auth/passwordPolicy";
import { verifyPasswordResetToken } from "@/lib/auth/passwordResetToken";
import { verifyAccessToken } from "@/lib/auth/jwt"; // assumes this exists alongside signAccessToken
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimiter";
import { sanitizeInput } from "@/lib/validation/sanitize";
import { logAudit } from "@/lib/auth/auditLog";


const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  resetToken: z.string().optional(),
  newPassword: z.string().min(12),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit("change-password", ip);

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
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { currentPassword, resetToken, newPassword } = parsed.data;

    let userId: string | null = null;

    if (resetToken) {
      const decoded = verifyPasswordResetToken(resetToken);
      if (!decoded) {
        return NextResponse.json(
          { error: "Reset link is invalid or has expired. Please log in again." },
          { status: 401 }
        );
      }
      userId = decoded.userId;
    } else {
      const accessToken = req.cookies.get("accessToken")?.value;
      const session = accessToken ? verifyAccessToken(accessToken) : null;
      if (!session) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      userId = session.userId;
    }

    await connectDB();

    const user = await User.findById(userId).select(
      "+passwordHash +passwordHistory"
    );

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (!resetToken) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required." },
          { status: 400 }
        );
      }
      const currentValid = await verifyPassword(user.passwordHash, currentPassword);
      if (!currentValid) {
        await logAudit("password_change_failed", {}, user._id.toString(), ip);
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 401 }
        );
      }
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        { error: "Weak password", reasons: strength.reasons },
        { status: 400 }
      );
    }

    const reused = await isPasswordReused(
      newPassword,
      user.passwordHash,
      user.passwordHistory
    );
    if (reused) {
      return NextResponse.json(
        {
          error: `You can't reuse a recent password. Choose one you haven't used in your last ${PASSWORD_HISTORY_SIZE} changes.`,
        },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    const updatedHistory = [user.passwordHash, ...user.passwordHistory].slice(
      0,
      PASSWORD_HISTORY_SIZE
    );

    user.passwordHash = newHash;
    user.passwordHistory = updatedHistory;
    user.passwordChangedAt = new Date();
    await user.save();

    await logAudit(
      resetToken ? "password_changed_after_expiry" : "password_changed",
      {},
      user._id.toString(),
      ip
    );

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err); // never log password/hash
    return NextResponse.json({ error: "Password change failed" }, { status: 500 });
  }
}