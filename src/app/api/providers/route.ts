import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { ProviderProfile } from "@/models/ProviderProfile";
import { requireRole, requireAuth } from "@/middleware/auth";
import { verifyCsrfToken } from "@/lib/auth/csrf";

const CreateProfileSchema = z.object({
  serviceCategory: z.string().min(2).max(100),
  hourlyRate: z.number().positive(),
  bio: z.string().max(1000).optional(),
});


export const POST = requireRole(["provider"], async (req, { session }) => {
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CreateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  const existing = await ProviderProfile.findOne({ userId: session.userId });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 400 });
  }

  const profile = await ProviderProfile.create({
    userId: session.userId,
    ...parsed.data,
    verificationStatus: "pending", 
  });

  return NextResponse.json({ message: "Provider profile created", profile }, { status: 201 });
});

export const GET = requireAuth(async (req) => {
  await connectDB();

  const providers = await ProviderProfile.find({ verificationStatus: "approved" }).populate(
    "userId",
    "name email"
  );

  return NextResponse.json({ providers });
});