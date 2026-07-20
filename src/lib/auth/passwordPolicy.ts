export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_HISTORY_SIZE = 5; // last N password hashes checked for reuse
export const PASSWORD_EXPIRY_DAYS = 90;

export type PasswordScore = 0 | 1 | 2 | 3 | 4; // 0 = very weak, 4 = strong

export interface PasswordStrengthResult {
  valid: boolean;
  score: PasswordScore;
  reasons: string[];
}

const COMMON_PASSWORDS = new Set([
  "password123!",
  "qwertyuiop12",
  "letmein12345",
  "admin12345678",
  "welcome12345",
  "iloveyou1234",
]);

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const reasons: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    reasons.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  if (!/[a-z]/.test(password)) reasons.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) reasons.push("Add an uppercase letter.");
  if (!/[0-9]/.test(password)) reasons.push("Add a number.");
  if (!/[^a-zA-Z0-9]/.test(password)) reasons.push("Add a special character.");

  if (password.length > 0 && /^(.)\1+$/.test(password)) {
    reasons.push("Avoid repeating the same character.");
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    reasons.push("This password is too common. Choose something less predictable.");
  }

  return {
    valid: reasons.length === 0,
    score: scorePassword(password, reasons),
    reasons,
  };
}

function scorePassword(password: string, reasons: string[]): PasswordScore {
  if (password.length === 0) return 0;
  if (reasons.length >= 4) return 0;
  if (reasons.length === 3) return 1;
  if (reasons.length === 2) return 2;
  if (reasons.length === 1) return 3;
  // passed every check — reward extra length with the top score
  return password.length >= 16 ? 4 : 3;
}

export function isPasswordExpired(passwordChangedAt: Date | undefined): boolean {
  if (!passwordChangedAt) return false;
  const ageMs = Date.now() - passwordChangedAt.getTime();
  return ageMs > PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}