"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  email: string;
  name: string;
  role: "customer" | "provider" | "admin";
  bio?: string;
  phone?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (loading || !profile) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-semibold">
            Welcome, {profile.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile.email} · <span className="capitalize">{profile.role}</span>
          </p>
        </div>

        {profile.role === "customer" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-2">Customer Dashboard</h2>
            <p className="text-gray-600 text-sm">
              Browse providers and book a service. (Provider listing UI coming next.)
            </p>
          </div>
        )}

        {profile.role === "provider" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-2">Provider Dashboard</h2>
            <p className="text-gray-600 text-sm">
              Manage your profile and view incoming bookings. (Booking management UI coming next.)
            </p>
          </div>
        )}

        {profile.role === "admin" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-2">Admin Dashboard</h2>
            <p className="text-gray-600 text-sm">
              Review pending provider verifications. (Admin UI coming next.)
            </p>
          </div>
        )}
      </div>
    </main>
  );
}