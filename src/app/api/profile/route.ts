import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { requireAuth } from "@/middleware/auth";
import { verifyCsrfToken } from "@/lib/auth/csrf";

const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const PATCH = requireAuth(async (req, { session }) => {
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ProfileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { name, phone, bio } = parsed.data;

  if (name !== undefined) user.name = escapeHtml(name);
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = escapeHtml(bio);

  await user.save();

  return NextResponse.json({
    message: "Profile updated",
    profile: { name: user.name, phone: user.phone, bio: user.bio },
  });
});

export const GET = requireAuth(async (req, { session }) => {
  await connectDB();

  const user = await User.findById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      email: user.email,
      name: user.name,
      phone: user.phone,
      bio: user.bio,
      role: user.role,
    },
  });
});