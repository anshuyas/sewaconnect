"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";

interface Provider {
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

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingFor, setBookingFor] = useState<Provider | null>(null);
  const [hours, setHours] = useState(1);
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers || []);
        setLoading(false);
      });
  }, []);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!bookingFor) return;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({
        providerId: bookingFor.userId._id,
        serviceDescription: description,
        estimatedHours: hours,
        scheduledFor: new Date(scheduledFor).toISOString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Booking failed");
      return;
    }

    setMessage(`Booking created! Total: NPR ${data.booking.price}`);
    setBookingFor(null);
    setDescription("");
    setHours(1);
    setScheduledFor("");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Loading providers...</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-medium mb-6">Available Providers</h1>

          {message && (
            <div className="bg-success/10 border border-success/30 text-success rounded-lg px-4 py-3 mb-4 text-sm">
              {message}
            </div>
          )}

          {providers.length === 0 && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 text-center">
              <p className="text-muted text-sm">No verified providers yet.</p>
            </div>
          )}

          <div className="space-y-4">
            {providers.map((p) => (
              <div key={p._id} className="bg-surface border border-border rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium">{p.userId.name}</h2>
                      <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success border border-success/30 px-2 py-0.5 rounded-full font-medium">
                        ✓ Verified
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1">{p.serviceCategory}</p>
                    {p.bio && <p className="text-sm text-text mt-2">{p.bio}</p>}
                    <p className="text-sm font-medium mt-2 text-primary">NPR {p.hourlyRate}/hr</p>
                  </div>
                  <button
                    onClick={() => setBookingFor(p)}
                    className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors"
                  >
                    Book
                  </button>
                </div>

                {bookingFor?._id === p._id && (
                  <form onSubmit={handleBook} className="mt-4 border-t border-border pt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        What do you need done?
                      </label>
                      <input
                        required
                        minLength={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1.5">
                          Estimated hours
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={24}
                          value={hours}
                          onChange={(e) => setHours(Number(e.target.value))}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1.5">
                          Date & time
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={scheduledFor}
                          onChange={(e) => setScheduledFor(e.target.value)}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>

                    <p className="text-sm text-muted">
                      Estimated total:{" "}
                      <span className="font-medium text-text">
                        NPR {(p.hourlyRate * hours).toFixed(2)}
                      </span>
                    </p>

                    {error && (
                      <p className="text-danger text-sm bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
                        {error}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors"
                      >
                        Confirm booking
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingFor(null)}
                        className="border border-border text-muted rounded-lg px-4 py-2 text-sm font-medium hover:bg-bg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}