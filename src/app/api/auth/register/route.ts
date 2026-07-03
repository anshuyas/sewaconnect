import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { checkRateLimit, getClientIp } from "@/lib/auth/rateLimiter";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  role: z.enum(["customer", "provider"]).default("customer"),
});

export async function POST(req: NextRequest) {
    const ip = getClientIp(req);
  const rateLimit = await checkRateLimit("register", ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role } = parsed.data;

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json(
        { error: "Weak password", reasons: strength.reasons },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "Registration could not be completed" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await User.create({
      email,
      passwordHash,
      name,
      phone,
      role, 
    });

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err); // never log password/hash
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}