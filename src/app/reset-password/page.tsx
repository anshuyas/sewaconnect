"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { validatePasswordStrength } from "@/lib/auth/passwordPolicy";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Reset link missing or invalid
        </h1>
        <p className="text-gray-500 text-sm">
          This page needs a valid reset link. Please try logging in again —
          if your password has expired, you'll be sent here automatically
          with a valid link.
        </p>
        <a href="/login" className="inline-block text-blue-600 text-sm font-medium hover:underline">
          Back to login
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 text-center space-y-3">
        <h1 className="text-xl font-semibold text-green-700">
          Password updated
        </h1>
        <p className="text-gray-500 text-sm">
          You can now log in with your new password.
        </p>
        <a href="/login" className="inline-block text-blue-600 text-sm font-medium hover:underline">
          Go to login
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setReasons([]);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      setError("Weak password");
      setReasons(strength.reasons);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setReasons(data.reasons || []);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-6">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">
        Set a new password
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Your password has expired. Choose a new one to continue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
            required
          />
          <PasswordStrengthMeter password={newPassword} className="mt-2" />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            {reasons.length > 0 && (
              <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}