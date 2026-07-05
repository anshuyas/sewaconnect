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
  requested: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
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
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading bookings...</p>
      </main>
    );
  }

  return (
    <>
    <Navbar/>
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Your Bookings</h1>

        {actionError && (
          <div className="bg-red-100 text-red-800 rounded p-3 mb-4 text-sm">
            {actionError}
          </div>
        )}

        {bookings.length === 0 && (
          <p className="text-gray-500">No bookings yet.</p>
        )}

        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{b.serviceDescription}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(b.scheduledFor).toLocaleString()} · NPR {b.price}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                    statusColors[b.status] || "bg-gray-100"
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="flex gap-2 mt-3">
                {b.status === "requested" && (
                  <button
                    onClick={() => updateStatus(b._id, "accepted")}
                    className="bg-blue-600 text-white rounded px-3 py-1.5 text-sm hover:bg-blue-700"
                  >
                    Accept
                  </button>
                )}
                {b.status === "accepted" && (
                  <button
                    onClick={() => updateStatus(b._id, "completed")}
                    className="bg-purple-600 text-white rounded px-3 py-1.5 text-sm hover:bg-purple-700"
                  >
                    Mark completed
                  </button>
                )}
                {b.status === "completed" && (
                  <button
                    onClick={() => updateStatus(b._id, "paid")}
                    className="bg-green-600 text-white rounded px-3 py-1.5 text-sm hover:bg-green-700"
                  >
                    Simulate Payment
                  </button>
                )}
                {(b.status === "requested" || b.status === "accepted") && (
                  <button
                    onClick={() => updateStatus(b._id, "cancelled")}
                    className="text-gray-600 text-sm hover:underline"
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