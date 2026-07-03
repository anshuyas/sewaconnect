"use client";

import { useEffect, useState } from "react";

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
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading providers...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Available Providers</h1>

        {message && (
          <div className="bg-green-100 text-green-800 rounded p-3 mb-4 text-sm">
            {message}
          </div>
        )}

        {providers.length === 0 && (
          <p className="text-gray-500">No verified providers yet.</p>
        )}

        <div className="space-y-4">
          {providers.map((p) => (
            <div key={p._id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-medium">{p.userId.name}</h2>
                  <p className="text-sm text-gray-500">{p.serviceCategory}</p>
                  {p.bio && <p className="text-sm text-gray-600 mt-1">{p.bio}</p>}
                  <p className="text-sm font-medium mt-2">NPR {p.hourlyRate}/hr</p>
                </div>
                <button
                  onClick={() => setBookingFor(p)}
                  className="bg-orange-600 text-white rounded px-4 py-2 text-sm hover:bg-orange-700"
                >
                  Book
                </button>
              </div>

              {bookingFor?._id === p._id && (
                <form onSubmit={handleBook} className="mt-4 border-t pt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      What do you need done?
                    </label>
                    <input
                      required
                      minLength={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Estimated hours
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={24}
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        Date & time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full border rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">
                    Estimated total: NPR {(p.hourlyRate * hours).toFixed(2)}
                  </p>

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-orange-600 text-white rounded px-4 py-2 text-sm hover:bg-orange-700"
                    >
                      Confirm booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingFor(null)}
                      className="text-gray-600 text-sm"
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
  );
}