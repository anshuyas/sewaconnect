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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
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
      } catch (error) {
        console.error("Failed to load profile:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <Navbar />
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-semibold">
            Welcome, {profile.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {profile.email} ·{" "}
            <span className="capitalize">{profile.role}</span>
          </p>
        </div>

        {/* Customer Dashboard */}
        {profile.role === "customer" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">
              Customer Dashboard
            </h2>

            <Link
              href="/providers"
              className="inline-block bg-orange-600 text-white rounded px-4 py-2 text-sm hover:bg-orange-700 transition-colors"
            >
              Browse Providers
            </Link>

            <Link
              href="/bookings"
              className="inline-block ml-2 bg-gray-200 text-gray-800 rounded px-4 py-2 text-sm hover:bg-gray-300"
            >
              My Bookings
            </Link>
          </div>
        )}

        {/* Provider Dashboard */}
        {profile.role === "provider" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-2">
              Provider Dashboard
            </h2>
            <p className="text-gray-600 text-sm">
              Manage your profile and view incoming bookings.
              (Booking management UI coming next.)
            </p>

            <Link
              href="/bookings"
              className="inline-block bg-orange-600 text-white rounded px-4 py-2 text-sm hover:bg-orange-700"
            >
              View Bookings
            </Link>

            <Link
              href="/provider-setup"
              className="inline-block bg-gray-200 text-gray-800 rounded px-4 py-2 text-sm hover:bg-gray-300 mr-2"
            >
              Set Up / Edit Profile
            </Link>
          </div>
        )}

        {/* Admin Dashboard */}
        {profile.role === "admin" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-2">
              Admin Dashboard
            </h2>
            <p className="text-gray-600 text-sm">
              Review pending provider verifications.
              (Admin UI coming next.)
            </p>

            <Link
              href="/admin/verify"
              className="inline-block bg-orange-600 text-white rounded px-4 py-2 text-sm hover:bg-orange-700"
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