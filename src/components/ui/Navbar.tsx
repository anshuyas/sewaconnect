"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Profile {
  name: string;
  role: "customer" | "provider" | "admin";
}

interface NavLink {
  href: string;
  label: string;
  show: boolean;
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|; )csrfToken=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
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

  if (!profile) {
    return (
      <nav className="bg-primary sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-8 h-16 flex items-center">
          <a href="/dashboard" className="font-display font-semibold text-lg text-white">
            Sewa<span className="text-accent">Connect</span>
          </a>
        </div>
      </nav>
    );
  }

  const initial = profile.name ? profile.name.charAt(0).toUpperCase() : "?";

  const allLinks: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", show: true },
    { href: "/providers", label: "Browse", show: profile.role === "customer" },
    { href: "/bookings", label: "Bookings", show: true },
    { href: "/provider-setup", label: "My Profile", show: profile.role === "provider" },
    { href: "/admin/verify", label: "Verify", show: profile.role === "admin" },
  ];

  const visibleLinks = allLinks.filter(function (link) {
    return link.show;
  });

  return (
    <nav className="bg-primary sticky top-0 z-10 shadow-sm">
      <div className="px-8 h-16 flex items-center w-full">
        <a href="/dashboard" className="font-display font-semibold text-lg text-white mr-auto">
          Sewa<span className="text-accent">Connect</span>
        </a>

        <div className="flex items-center gap-10 text-sm">
          {visibleLinks.map(function (link) {
            const isActive = pathname === link.href;
            const linkClass = isActive
              ? "font-semibold text-white transition-colors"
              : "font-medium text-white/70 hover:text-white transition-colors";

            return (
              <a key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </a>
            );
          })}

          <div className="h-6 w-px bg-white/20" />

          <div className="w-8 h-8 rounded-full bg-accent text-primary-dark font-semibold flex items-center justify-center text-xs">
            {initial}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-white/70 hover:text-white text-xs font-medium ml-8"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}