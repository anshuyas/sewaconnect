import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { ProviderProfile } from "@/models/ProviderProfile";
import { requireRole } from "@/middleware/auth";
import { verifyCsrfToken } from "@/lib/auth/csrf";

const VerifyProviderSchema = z.object({
  providerProfileId: z.string().length(24),
  decision: z.enum(["approved", "rejected"]),
});

// Admin-only — this is the RBAC test against a genuine third role.
export const PATCH = requireRole(["admin"], async (req) => {
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = VerifyProviderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  const profile = await ProviderProfile.findById(parsed.data.providerProfileId);
  if (!profile) {
    return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });
  }

  profile.verificationStatus = parsed.data.decision;
  await profile.save();

  return NextResponse.json({ message: "Provider verification updated", profile });
});

// List pending providers for admin review
export const GET = requireRole(["admin"], async () => {
  await connectDB();

  const pending = await ProviderProfile.find({ verificationStatus: "pending" }).populate(
    "userId",
    "name email"
  );

  return NextResponse.json({ pending });
});