"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer" as "customer" | "provider",
  });
  const [error, setError] = useState("");
  const [passwordHints, setPasswordHints] = useState<string[]>([]);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPasswordHints([]);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        if (data.reasons) setPasswordHints(data.reasons);
        setLoading(false);
        return;
      }

      router.push("/login");
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
            Your skills,
            <br />
            someone&apos;s solution.
          </p>
          <p className="text-white/70 text-sm mt-4 max-w-xs">
            Join as a customer looking for help, or a provider ready to offer
            your services.
          </p>
        </div>

        <div className="flex gap-6 relative z-10">
          <div>
            <p className="font-display text-2xl font-semibold text-accent">2</p>
            <p className="text-white/60 text-xs mt-1">Ways to join</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-accent">✓</p>
            <p className="text-white/60 text-xs mt-1">Providers reviewed before listing</p>
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
            <h2 className="font-display text-2xl font-medium mb-1">Create an account</h2>
            <p className="text-muted text-sm mb-6">Get started in a minute</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-text">Full name</label>
                <input
                  name="name"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-text">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-text">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {(passwordFocused || form.password.length > 0) && (
                  <p className="text-xs text-muted mt-1.5">
                    At least 12 characters, with uppercase, lowercase, a number, and a symbol.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-text">I am a...</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  <option value="customer">Customer (looking for services)</option>
                  <option value="provider">Provider (offering services)</option>
                </select>
              </div>

              {error && (
                <div className="text-danger text-sm bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
                  <p>{error}</p>
                  {passwordHints.length > 0 && (
                    <ul className="list-disc list-inside mt-1">
                      {passwordHints.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white rounded-lg py-2.5 font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
          </div>

          <p className="text-sm text-center mt-6 text-muted">
            Already have an account?{" "}
            <a href="/login" className="text-primary font-medium hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}