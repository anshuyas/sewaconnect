import jwt from "jsonwebtoken";

const SECRET = process.env.PASSWORD_RESET_SECRET;
const EXPIRY = "10m"; 

interface PasswordResetPayload {
  userId: string;
  purpose: "password_expired";
}

export function signPasswordResetToken(userId: string): string {
  if (!SECRET) {
    throw new Error("PASSWORD_RESET_SECRET is not set");
  }
  const payload: PasswordResetPayload = { userId, purpose: "password_expired" };
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyPasswordResetToken(token: string): { userId: string } | null {
  if (!SECRET) {
    throw new Error("PASSWORD_RESET_SECRET is not set");
  }
  try {
    const decoded = jwt.verify(token, SECRET) as PasswordResetPayload;
    if (decoded.purpose !== "password_expired") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}