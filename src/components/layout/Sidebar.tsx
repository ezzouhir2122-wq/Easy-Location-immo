"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navGroups = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", icon: "⊞", label: "Tableau de bord" },
      { href: "/biens", icon: "🏠", label: "Biens" },
      { href: "/locataires", icon: "👥", label: "Locataires" },
      { href: "/contrats", icon: "📋", label: "Contrats" },
    ],
  },
  {
    label: "Finances & Fiscalité",
    items: [
      { href: "/loyers", icon: "💶", label: "Loyers" },
      { href: "/charges", icon: "📊", label: "Charges" },
      { href: "/fiscalite", icon: "🏛", label: "Fiscalité" },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/documents", icon: "📁", label: "Documents" },
      { href: "/parametres", icon: "⚙️", label: "Paramètres" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        const meta = data.user.user_metadata;
        const full = meta?.full_name ?? meta?.name ?? null;
        setUserFullName(full);
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function getInitials(name: string | null, email: string | null): string {
    if (name) {
      const parts = name.trim().split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "?";
  }

  const displayName = userFullName ?? userEmail ?? "Propriétaire";

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0B1A2F 0%, #0d1f38 100%)",
        borderRight: "1px solid #1E3352",
      }}
    >
      {/* Shimmer top line */}
      <div
        style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, #2563EB, transparent)",
        }}
      />

      {/* Logo */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "#1E3352" }}>
        <Image src="/logo.png" alt="Easy Location Immo" width={160} height={48} style={{ height: "48px", width: "auto" }} priority />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p
              className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#4A6080" }}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && (pathname ?? "").startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all relative"
                  style={{
                    color: active ? "#FFFFFF" : "#8BA0BC",
                    background: active ? "rgba(37,99,235,0.15)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                      style={{ background: "#2563EB" }}
                    />
                  )}
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#1E3352" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
          >
            {getInitials(userFullName, userEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{displayName}</p>
            <p className="text-xs truncate" style={{ color: "#4A6080" }}>
              Propriétaire
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Déconnexion"
            className="text-xs transition-colors"
            style={{ color: "#4A6080" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4A6080")}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
