import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextRequest } from "next/server";
import { getBlockStatus, isIpAllowlisted, blockIp } from "@/lib/security/ipRules";

const limiters = {
  login: new RateLimiterMemory({ points: 10, duration: 60 }), // 10 req / 60s / IP
  register: new RateLimiterMemory({ points: 5, duration: 60 }),
  mfa: new RateLimiterMemory({ points: 10, duration: 60 }),
  "change-password": new RateLimiterMemory({ points: 5, duration: 60 }), // 5 req / 60s / IP
};

export type LimiterKey = keyof typeof limiters;

const violationTracker = new RateLimiterMemory({ points: 5, duration: 30 * 60 }); // 5 violations / 30 min
const AUTO_BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour — matches the account-lockout order of magnitude used elsewhere

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return "unknown";
}

export async function checkRateLimit(
  key: LimiterKey,
  ip: string
): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: "blocked" | "rate_limited";
}> {
  if (ip !== "unknown") {
    const allowlisted = await isIpAllowlisted(ip);
    if (allowlisted) return { allowed: true };

    const blockStatus = await getBlockStatus(ip);
    if (blockStatus.blocked) {
      return {
        allowed: false,
        retryAfterSeconds: blockStatus.retryAfterSeconds ?? 3600,
        reason: "blocked",
      };
    }
  }

  try {
    await limiters[key].consume(ip);
    return { allowed: true };
  } catch (rejection: any) {
    if (ip !== "unknown") {
      try {
        await violationTracker.consume(ip);
      } catch {
        await blockIp(
          ip,
          "Automated: repeated rate-limit violations across endpoints",
          AUTO_BLOCK_DURATION_MS
        ).catch(() => {
        });
      }
    }

    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((rejection?.msBeforeNext ?? 60000) / 1000),
      reason: "rate_limited",
    };
  }
}