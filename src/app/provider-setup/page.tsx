"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export default function ProviderSetupPage() {
  const router = useRouter();
  const [serviceCategory, setServiceCategory] = useState("");
  const [hourlyRate, setHourlyRate] = useState(500);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/providers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({ serviceCategory, hourlyRate, bio }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Setup failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm">
          <div className="bg-surface border border-border rounded-2xl shadow-sm p-8">
            <h1 className="font-display text-2xl font-medium mb-1 text-center">
              Set up your provider profile
            </h1>
            <p className="text-sm text-muted text-center mb-6">
              An admin will review and approve your profile before customers can book you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Service category</label>
                <input
                  required
                  placeholder="e.g. Plumbing, Tutoring, Electrical"
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Hourly rate (NPR)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

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
                {loading ? "Submitting..." : "Submit for review"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}