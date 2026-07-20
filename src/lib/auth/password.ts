import argon2 from "argon2";
import { validatePasswordStrength } from "./passwordPolicy";

export { validatePasswordStrength };

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, 
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

export async function isPasswordReused(
  newPassword: string,
  currentHash: string | undefined,
  historyHashes: string[] = []
): Promise<boolean> {
  const hashesToCheck = [currentHash, ...historyHashes].filter(
    (h): h is string => Boolean(h)
  );

  for (const hash of hashesToCheck) {
    if (await verifyPassword(hash, newPassword)) {
      return true;
    }
  }
  return false;
}