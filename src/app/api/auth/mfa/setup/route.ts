import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { getSessionUser } from "@/lib/auth/session";
import { generateMfaSecret, generateQrCodeDataUrl } from "@/lib/auth/mfa";
import { encryptField } from "@/lib/crypto/encryption";

export async function POST(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.mfaEnabled) {
    return NextResponse.json(
      { error: "MFA is already enabled" },
      { status: 400 }
    );
  }

  const secret = generateMfaSecret();
  const qrCodeDataUrl = await generateQrCodeDataUrl(user.email, secret);

  user.mfaSecret = encryptField(secret);
  await user.save();

  return NextResponse.json({ qrCodeDataUrl });
}