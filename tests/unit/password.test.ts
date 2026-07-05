import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("TestPassword123!");
    expect(hash).not.toBe("TestPassword123!");
    expect(await verifyPassword(hash, "TestPassword123!")).toBe(true);
  });

  it("rejects an incorrect password against a valid hash", async () => {
    const hash = await hashPassword("TestPassword123!");
    expect(await verifyPassword(hash, "WrongPassword123!")).toBe(false);
  });

  it("rejects a malformed hash instead of throwing", async () => {
    expect(await verifyPassword("not-a-real-hash", "anything")).toBe(false);
  });
});

describe("password strength validation", () => {
  it("accepts a strong password", () => {
    const result = validatePasswordStrength("StrongPass123!");
    expect(result.valid).toBe(true);
  });

  it("rejects a password that is too short", () => {
    const result = validatePasswordStrength("Short1!");
    expect(result.valid).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("rejects a password missing a special character", () => {
    const result = validatePasswordStrength("NoSpecialChar123");
    expect(result.valid).toBe(false);
  });
});