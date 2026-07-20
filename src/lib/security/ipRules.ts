import { connectDB } from "@/lib/db/connect";
import { IpRule } from "@/models/IpRule";

interface BlockStatus {
  blocked: boolean;
  retryAfterSeconds?: number; 
}

export async function getBlockStatus(ip: string): Promise<BlockStatus> {
  await connectDB();
  const rule = await IpRule.findOne({ ip, type: "block" });

  if (!rule) return { blocked: false };

  if (rule.expiresAt) {
    const retryAfterSeconds = Math.max(
      0,
      Math.ceil((rule.expiresAt.getTime() - Date.now()) / 1000)
    );
    return { blocked: true, retryAfterSeconds };
  }

  return { blocked: true }; // permanent block
}

export async function isIpAllowlisted(ip: string): Promise<boolean> {
  await connectDB();
  const rule = await IpRule.findOne({ ip, type: "allow" });
  return !!rule;
}

export async function blockIp(
  ip: string,
  reason: string,
  durationMs?: number
): Promise<void> {
  await connectDB();
  const expiresAt = durationMs ? new Date(Date.now() + durationMs) : undefined;
  await IpRule.findOneAndUpdate(
    { ip, type: "block" },
    { ip, type: "block", reason, expiresAt, createdAt: new Date() },
    { upsert: true, new: true }
  );
}

export async function allowIp(ip: string, reason: string): Promise<void> {
  await connectDB();
  await IpRule.findOneAndUpdate(
    { ip, type: "allow" },
    { ip, type: "allow", reason, createdAt: new Date() },
    { upsert: true, new: true }
  );
}

export async function removeIpRule(ip: string): Promise<number> {
  await connectDB();
  const result = await IpRule.deleteMany({ ip });
  return result.deletedCount ?? 0;
}