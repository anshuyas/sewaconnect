import argon2 from "argon2";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB — OWASP minimum recommendation
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(
  hash: string,
  plainPassword: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (password.length < 12) {
    reasons.push("Password must be at least 12 characters long.");
  }
  if (!/[a-z]/.test(password)) {
    reasons.push("Password must include a lowercase letter.");
  }
  if (!/[A-Z]/.test(password)) {
    reasons.push("Password must include an uppercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    reasons.push("Password must include a number.");
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    reasons.push("Password must include a special character.");
  }

  return { valid: reasons.length === 0, reasons };
}