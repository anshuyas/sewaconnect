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
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <>
    <Navbar/>
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Pending Provider Verifications</h1>

        {pending.length === 0 && (
          <p className="text-gray-500">No pending providers.</p>
        )}

        <div className="space-y-4">
          {pending.map((p) => (
            <div key={p._id} className="bg-white rounded-lg shadow p-5">
              <p className="font-medium">{p.userId.name}</p>
              <p className="text-sm text-gray-500">{p.userId.email}</p>
              <p className="text-sm mt-1">
                {p.serviceCategory} · NPR {p.hourlyRate}/hr
              </p>
              {p.bio && <p className="text-sm text-gray-600 mt-1">{p.bio}</p>}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => decide(p._id, "approved")}
                  className="bg-green-600 text-white rounded px-4 py-1.5 text-sm hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(p._id, "rejected")}
                  className="bg-red-600 text-white rounded px-4 py-1.5 text-sm hover:bg-red-700"
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