"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";

interface Profile {
  email: string;
  name: string;
  role: "customer" | "provider" | "admin";
  bio?: string;
  phone?: string;
}

interface Booking {
  _id: string;
  serviceDescription: string;
  price: number;
  status: string;
  scheduledFor: string;
}

const statusColors: Record<string, string> = {
  requested: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        setProfile(data.profile);

        if (data.profile.role === "admin") {
          const pendingRes = await fetch("/api/admin/verify-provider");
          if (pendingRes.ok) {
            const pendingData = await pendingRes.json();
            setPendingCount(pendingData.pending?.length || 0);
          }
        } else {
          const bookingsRes = await fetch("/api/bookings");
          if (bookingsRes.ok) {
            const bookingsData = await bookingsRes.json();
            setBookings(bookingsData.bookings || []);
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-muted text-sm">Loading...</p>
      </main>
    );
  }

  const activeCount = bookings.filter((b) =>
    ["requested", "accepted"].includes(b.status)
  ).length;
  const completedCount = bookings.filter((b) =>
    ["completed", "paid"].includes(b.status)
  ).length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-medium">
              Welcome, {profile.name}
            </h1>
            <p className="text-muted text-sm mt-1">
              {profile.email} ·{" "}
              <span className="capitalize inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full ml-1">
                {profile.role}
              </span>
            </p>
          </div>

          {profile.role !== "admin" && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-5">
                <p className="font-display text-3xl font-semibold text-primary">
                  {activeCount}
                </p>
                <p className="text-muted text-sm mt-1">Active bookings</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl shadow-sm p-5">
                <p className="font-display text-3xl font-semibold text-accent-dark">
                  {completedCount}
                </p>
                <p className="text-muted text-sm mt-1">Completed</p>
              </div>
            </div>
          )}

          {profile.role === "admin" && pendingCount !== null && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-5 mb-6">
              <p className="font-display text-3xl font-semibold text-accent-dark">
                {pendingCount}
              </p>
              <p className="text-muted text-sm mt-1">Providers awaiting verification</p>
            </div>
          )}

          {profile.role === "customer" && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-medium">Recent bookings</h2>
              </div>

              {bookings.length === 0 && (
                <p className="text-muted text-sm">No bookings yet.</p>
              )}

              {bookings.length > 0 && (
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.serviceDescription}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(b.scheduledFor).toLocaleDateString()} · NPR {b.price}
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
                  ))}
                  {bookings.length > 3 && (
                    <Link
                      href="/bookings"
                      className="text-primary text-sm font-medium hover:underline block text-center pt-1"
                    >
                      View all bookings →
                    </Link>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Link
                  href="/providers"
                  className="inline-block bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Browse Providers
                </Link>
                <Link
                  href="/bookings"
                  className="inline-block border border-border rounded-lg px-4 py-2 text-sm font-medium hover:bg-bg transition-colors"
                >
                  My Bookings
                </Link>
              </div>
            </div>
          )}

          {profile.role === "provider" && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="font-display text-lg font-medium mb-4">Recent bookings</h2>

              {bookings.length === 0 && (
                <p className="text-muted text-sm">No bookings yet.</p>
              )}

              {bookings.length > 0 && (
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.serviceDescription}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(b.scheduledFor).toLocaleDateString()} · NPR {b.price}
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
                  ))}
                  {bookings.length > 3 && (
                    <Link
                      href="/bookings"
                      className="text-primary text-sm font-medium hover:underline block text-center pt-1"
                    >
                      View all bookings →
                    </Link>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                <Link
                  href="/provider-setup"
                  className="inline-block border border-border rounded-lg px-4 py-2 text-sm font-medium hover:bg-bg transition-colors"
                >
                  Set Up / Edit Profile
                </Link>
                <Link
                  href="/bookings"
                  className="inline-block bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  View Bookings
                </Link>
              </div>
            </div>
          )}

          {profile.role === "admin" && (
            <div className="bg-surface border border-border rounded-2xl shadow-sm p-6">
              <h2 className="font-display text-lg font-medium mb-4">Admin Dashboard</h2>
              <Link
                href="/admin/verify"
                className="inline-block bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                Review Pending Providers
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}