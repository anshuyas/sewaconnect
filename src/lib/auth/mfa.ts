import { authenticator } from "otplib";
import QRCode from "qrcode";

const ISSUER = process.env.MFA_ISSUER || "SewaConnect";

export function generateMfaSecret(): string {
  return authenticator.generateSecret();
}

export async function generateQrCodeDataUrl(
  email: string,
  secret: string
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, ISSUER, secret);
  return QRCode.toDataURL(otpauthUrl);
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}