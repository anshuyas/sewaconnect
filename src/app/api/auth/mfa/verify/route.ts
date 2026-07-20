import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth/session";
import { verifyTotpToken } from "@/lib/auth/mfa";
import { decryptField } from "@/lib/crypto/encryption";
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimiter";

const VerifySchema = z.object({
  token: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit("mfa", ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          rateLimit.reason === "blocked"
            ? "Your IP has been temporarily blocked due to suspicious activity."
            : "Too many attempts. Please try again later.",
      },
      {
        status: rateLimit.reason === "blocked" ? 403 : 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const session = getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(session.userId).select("+mfaSecret");
  if (!user || !user.mfaSecret) {
    return NextResponse.json(
      { error: "MFA setup has not been started" },
      { status: 400 }
    );
  }

  const secret = decryptField(user.mfaSecret);
  const isValid = verifyTotpToken(parsed.data.token, secret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  user.mfaEnabled = true;
  await user.save();

  return NextResponse.json({ message: "MFA enabled successfully" });
}