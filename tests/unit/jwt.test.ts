import { describe, it, expect } from "vitest";
import { signAccessToken, verifyAccessToken } from "@/lib/auth/jwt";

describe("JWT access tokens", () => {
  it("signs and verifies a valid token", () => {
    const payload = { userId: "abc123", role: "customer", jti: "xyz" };
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe("abc123");
    expect(decoded.role).toBe("customer");
  });

  it("throws when verifying a tampered token", () => {
    const payload = { userId: "abc123", role: "customer", jti: "xyz" };
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -5) + "aaaaa";
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});