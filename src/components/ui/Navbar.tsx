"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  name: string;
  role: "customer" | "provider" | "admin";
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export default function Navbar() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data?.profile || null))
      .catch(() => setProfile(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "x-csrf-token": getCsrfToken() },
    });
    router.push("/login");
  }

  return (
    <nav className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/dashboard" className="font-display font-semibold text-xl text-primary">
          Sewa<span className="text-accent">Connect</span>
        </a>

        {profile && (
          <div className="flex items-center gap-5 text-sm">
            <a href="/dashboard" className="text-muted hover:text-primary transition-colors">
              Dashboard
            </a>
            {profile.role === "customer" && (
              <a href="/providers" className="text-muted hover:text-primary transition-colors">
                Browse
              </a>
            )}
            <a href="/bookings" className="text-muted hover:text-primary transition-colors">
              Bookings
            </a>
            {profile.role === "admin" && (
              <a href="/admin/verify" className="text-muted hover:text-primary transition-colors">
                Verify
              </a>
            )}
            <div className="h-5 w-px bg-border" />
            <span className="text-muted">{profile.name}</span>
            <button
              onClick={handleLogout}
              className="text-muted hover:text-danger transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}