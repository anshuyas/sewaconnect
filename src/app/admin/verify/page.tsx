"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";

interface PendingProvider {
  _id: string;
  serviceCategory: string;
  hourlyRate: number;
  bio?: string;
  userId: { _id: string; name: string; email: string };
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export default function AdminVerifyPage() {
  const [pending, setPending] = useState<PendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPending() {
    const res = await fetch("/api/admin/verify-provider");
    if (!res.ok) {
      setError("Not authorized to view this page.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setPending(data.pending || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPending();
  }, []);

  async function decide(providerProfileId: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/admin/verify-provider", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({ providerProfileId, decision }),
    });

    if (res.ok) {
      loadPending();
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-danger text-sm">{error}</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-medium mb-6">
            Pending Provider Verifications
          </h1>

          {pending.length === 0 && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 text-center">
              <p className="text-muted text-sm">No pending providers.</p>
            </div>
          )}

          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p._id} className="bg-surface border border-border rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.userId.name}</p>
                  <span className="text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-muted">{p.userId.email}</p>
                <p className="text-sm mt-2">
                  <span className="font-medium">{p.serviceCategory}</span> · NPR {p.hourlyRate}/hr
                </p>
                {p.bio && <p className="text-sm text-muted mt-1">{p.bio}</p>}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => decide(p._id, "approved")}
                    className="bg-success text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(p._id, "rejected")}
                    className="bg-danger text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}