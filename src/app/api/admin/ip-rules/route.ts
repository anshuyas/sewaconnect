import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/connect";
import { IpRule } from "@/models/IpRule";
import { verifyAccessToken } from "@/lib/auth/jwt"; 
import { sanitizeInput } from "@/lib/validation/sanitize";
import { logAudit } from "@/lib/auth/auditLog";
import { getClientIp } from "@/lib/auth/rateLimiter";

function requireAdmin(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const session = accessToken ? verifyAccessToken(accessToken) : null;
  if (!session || session.role !== "admin") return null;
  return session;
}

const IpRuleInputSchema = z.object({
  ip: z.string().min(3).max(45), 
  type: z.enum(["block", "allow"]),
  reason: z.string().max(300).optional(),
  durationMs: z
    .number()
    .positive()
    .max(1000 * 60 * 60 * 24 * 30) // cap at 30 days
    .optional(), // omitted = permanent
});

export async function GET(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const rules = await IpRule.find().sort({ createdAt: -1 }).limit(200);
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const session = requireAdmin(req);
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = sanitizeInput(await req.json());
    const parsed = IpRuleInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { ip, type, reason, durationMs } = parsed.data;

    await connectDB();
    const expiresAt = durationMs ? new Date(Date.now() + durationMs) : undefined;

    await IpRule.findOneAndUpdate(
      { ip, type },
      { ip, type, reason, expiresAt, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await logAudit(
      type === "block" ? "ip_manually_blocked" : "ip_allowlisted",
      { ip, reason },
      session.userId,
      getClientIp(req)
    );

    return NextResponse.json({ message: "IP rule saved" }, { status: 201 });
  } catch (err) {
    console.error("IP rule error:", err);
    return NextResponse.json({ error: "Failed to save IP rule" }, { status: 500 });
  }
}