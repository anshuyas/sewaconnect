import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { IpRule } from "@/models/IpRule";
import { verifyAccessToken } from "@/lib/auth/jwt"; 
import { logAudit } from "@/lib/auth/auditLog";
import { getClientIp } from "@/lib/auth/rateLimiter";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { ip: string } }
) {
  const accessToken = req.cookies.get("accessToken")?.value;
  const session = accessToken ? verifyAccessToken(accessToken) : null;

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const decodedIp = decodeURIComponent(params.ip);
  const result = await IpRule.deleteMany({ ip: decodedIp });

  await logAudit(
    "ip_rule_removed",
    { ip: decodedIp },
    session.userId,
    getClientIp(req)
  );

  return NextResponse.json({
    message: "IP rule removed",
    deletedCount: result.deletedCount ?? 0,
  });
}