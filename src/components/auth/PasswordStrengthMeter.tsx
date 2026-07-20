"use client";

import { validatePasswordStrength, PASSWORD_MIN_LENGTH } from "@/lib/auth/passwordPolicy";

const SCORE_LABEL = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;
const SCORE_COLOR = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-600",
] as const;

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({ password, className = "" }: PasswordStrengthMeterProps) {
  const { score, reasons, valid } = validatePasswordStrength(password);
  const showEmpty = password.length === 0;

  return (
    <div className={`space-y-2 ${className}`} aria-live="polite">
      <div className="flex gap-1" role="presentation">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              showEmpty
                ? "bg-gray-200"
                : i < score
                ? SCORE_COLOR[score]
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {!showEmpty && (
        <p
          className={`text-sm font-medium ${
            valid ? "text-green-700" : "text-gray-600"
          }`}
        >
          {SCORE_LABEL[score]}
        </p>
      )}

      {reasons.length > 0 && !showEmpty && (
        <ul className="text-sm text-gray-500 space-y-0.5 list-disc list-inside">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <p className="text-sm text-gray-400">
          Use at least {PASSWORD_MIN_LENGTH} characters, mixing upper/lowercase,
          a number, and a symbol.
        </p>
      )}
    </div>
  );
}