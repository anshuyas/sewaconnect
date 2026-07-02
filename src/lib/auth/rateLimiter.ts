import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextRequest } from "next/server";

const limiters = {
  login: new RateLimiterMemory({ points: 10, duration: 60 }), // 10 req / 60s / IP
  register: new RateLimiterMemory({ points: 5, duration: 60 }),
  mfa: new RateLimiterMemory({ points: 10, duration: 60 }),
};

export type LimiterKey = keyof typeof limiters;

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
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    await limiters[key].consume(ip);
    return { allowed: true };
  } catch (rejection: any) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((rejection?.msBeforeNext ?? 60000) / 1000),
    };
  }
}