"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/ui/Navbar";

interface Booking {
  _id: string;
  serviceDescription: string;
  price: number;
  status: string;
  scheduledFor: string;
  customerId: string;
  providerId: string;
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

const statusColors: Record<string, string> = {
  requested: "bg-yellow-50 text-yellow-800 border-yellow-200",
  accepted: "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-purple-50 text-purple-800 border-purple-200",
  paid: "bg-green-50 text-green-800 border-green-200",
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");

  async function loadBookings() {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function updateStatus(bookingId: string, status: string) {
    setActionError("");

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": getCsrfToken(),
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();

    if (!res.ok) {
      setActionError(data.error || "Update failed");
      return;
    }

    loadBookings();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Loading bookings...</p>
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl font-medium mb-6">Bookings</h1>

          {actionError && (
            <div className="bg-danger/5 border border-danger/20 text-danger rounded-lg px-4 py-3 mb-4 text-sm">
              {actionError}
            </div>
          )}

          {bookings.length === 0 && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-8 text-center">
              <p className="text-muted text-sm">No bookings yet.</p>
            </div>
          )}

          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b._id} className="bg-surface border border-border rounded-2xl shadow-sm p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{b.serviceDescription}</p>
                    <p className="text-sm text-muted mt-1">
                      {new Date(b.scheduledFor).toLocaleString()} · NPR {b.price}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                      statusColors[b.status] || "bg-gray-100"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  {b.status === "requested" && (
                    <button
                      onClick={() => updateStatus(b._id, "accepted")}
                      className="bg-primary text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                      Accept
                    </button>
                  )}
                  {b.status === "accepted" && (
                    <button
                      onClick={() => updateStatus(b._id, "completed")}
                      className="bg-primary text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                      Mark completed
                    </button>
                  )}
                  {b.status === "completed" && (
                    <button
                      onClick={() => updateStatus(b._id, "paid")}
                      className="bg-success text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Simulate Payment
                    </button>
                  )}
                  {(b.status === "requested" || b.status === "accepted") && (
                    <button
                      onClick={() => updateStatus(b._id, "cancelled")}
                      className="border border-border text-muted rounded-lg px-3 py-1.5 text-sm font-medium hover:border-danger hover:text-danger transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}