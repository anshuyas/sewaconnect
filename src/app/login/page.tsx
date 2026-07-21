"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
  if (loading) return; // prevent double-submission
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    // @ts-expect-error grecaptcha is loaded globally via the script tag
    const recaptchaToken = grecaptcha.getResponse();

    if (!recaptchaToken) {
      setError("Please complete the CAPTCHA");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(mfaRequired && mfaToken ? { mfaToken } : {}),
        recaptchaToken,
      }),
    });

    const data = await res.json();

    if (data.passwordExpired && data.resetToken) {
      router.push(`/reset-password?token=${data.resetToken}`);
      return;
    }

    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      // @ts-expect-error grecaptcha is loaded globally
      grecaptcha.reset();
      return;
    }

    if (data.mfaRequired) {
      setMfaRequired(true);
      setLoading(false);
      // @ts-expect-error grecaptcha is loaded globally
      grecaptcha.reset();
      return;
    }

    router.push("/dashboard");
  } catch {
    setError("Something went wrong. Please try again.");
    setLoading(false);
  }
}

  return (
    <main className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        <h1 className="font-display text-2xl font-semibold text-white relative z-10">
          Sewa<span className="text-accent">Connect</span>
        </h1>

        <div className="relative z-10">
          <p className="font-display text-4xl font-medium text-white leading-tight">
            Trusted help,
            <br />
            right around the corner.
          </p>
          <p className="text-white/70 text-sm mt-4 max-w-xs">
            Every provider on SewaConnect is verified before they can take a
            single booking.
          </p>
        </div>

        <div className="flex gap-6 relative z-10">
          <div>
            <p className="font-display text-2xl font-semibold text-accent">2</p>
            <p className="text-white/60 text-xs mt-1">Roles, one platform</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-accent">✓</p>
            <p className="text-white/60 text-xs mt-1">Verified providers only</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-display text-3xl font-semibold text-primary">
              Sewa<span className="text-accent">Connect</span>
            </h1>
          </div>

          <div className="bg-surface border border-border rounded-2xl shadow-sm p-8">
          <h2 className="font-display text-2xl font-medium mb-1">Welcome back</h2>
          <p className="text-muted text-sm mb-6">Log in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-text">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={mfaRequired}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-white disabled:text-muted bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-text">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={mfaRequired}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-white disabled:text-muted bg-white"
              />
            </div>

            {mfaRequired && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-text">
                  Authenticator code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={mfaToken}
                  onChange={(e) => setMfaToken(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  autoFocus
                />
              </div>
            )}

            {error && (
              <p className="text-danger text-sm bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-2.5 font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Please wait..." : mfaRequired ? "Verify code" : "Log in"}
            </button>
            <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>
          </form>

          <div className="my-5 flex items-center gap-2">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted">OR</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <Link
            href="/api/auth/oauth/google"
            className="block w-full text-center border border-border rounded-lg py-2.5 text-sm font-medium hover:bg-white transition-colors bg-white"
          >
            Continue with Google
          </Link>

          <p className="text-sm text-center mt-6 text-muted">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary font-medium hover:underline">
              Register
            </a>
          </p>
        </div>
      </div>
      </div>
    </main>
  );
}