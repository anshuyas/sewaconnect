"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-2 text-center">Set up your provider profile</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          An admin will review and approve your profile before customers can book you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service category</label>
            <input
              required
              placeholder="e.g. Plumbing, Tutoring, Electrical"
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hourly rate (NPR)</label>
            <input
              type="number"
              required
              min={1}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bio (optional)</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white rounded py-2 font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit for review"}
          </button>
        </form>
      </div>
    </main>
  );
}