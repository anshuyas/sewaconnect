import { AuditLog, AuditAction } from "@/models/AuditLog";
import { connectDB } from "@/lib/db/connect";

export async function logAudit(
  action: AuditAction,
  details: Record<string, unknown> = {},
  userId?: string,
  ipAddress?: string
) {
  try {
    await connectDB();
    await AuditLog.create({ userId, action, details, ipAddress });
  } catch (err) {
    console.warn("Audit log write failed:", err);
  }
}