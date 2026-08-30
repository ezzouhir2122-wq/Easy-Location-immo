"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const mainNav = [
  { href: "/dashboard",   icon: "⊞", label: "Tableau de bord" },
  { href: "/biens",       icon: "🏠", label: "Biens" },
  { href: "/locataires",  icon: "👥", label: "Locataires" },
  { href: "/contrats",    icon: "📋", label: "Contrats" },
  { href: "/reservations", icon: "🗓️", label: "Réservations" },
  { href: "/calendrier",    icon: "📅", label: "Calendrier" },
  { href: "/taches",       icon: "🧰", label: "Tâches" },
];

const financeNav = [
  { href: "/loyers",   icon: "💶", label: "Loyers" },
  { href: "/charges",  icon: "📊", label: "Charges" },
  { href: "/comptabilite", icon: "📒", label: "Comptabilité" },
  { href: "/etats", icon: "📈", label: "États par bien" },
];

const fiscalNav = [
  { href: "/fiscalite",                  icon: "🏛",  label: "Dashboard Fiscal", exact: true },
  { href: "/fiscalite/calculateur",      icon: "🧮",  label: "Calculateur IR" },
  { href: "/fiscalite/declaration",      icon: "📋",  label: "Déclaration" },
  { href: "/fiscalite/tva",              icon: "🧾",  label: "TVA" },
  { href: "/fiscalite/taxe-habitation",  icon: "🏠",  label: "Taxe d'Habitation" },
  { href: "/fiscalite/tsc",              icon: "🏛",  label: "TSC" },
  { href: "/fiscalite/audit",            icon: "🔍",  label: "Audit" },
  { href: "/fiscalite/historique",       icon: "📜",  label: "Historique" },
  { href: "/fiscalite/configuration",    icon: "⚙️",  label: "Configuration" },
];

const gestionNav = [
  { href: "/documents",  icon: "📁", label: "Documents" },
  { href: "/parametres", icon: "⚙️", label: "Paramètres" },
];

type NavItem = { href: string; icon: string; label: string; exact?: boolean };

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all relative"
      style={{
        color: active ? "#FFFFFF" : "#8BA0BC",
        background: active ? "rgba(37,99,235,0.15)" : "transparent",
        fontWeight: active ? 600 : 400,
      }}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
          style={{ background: "#2563EB" }}
        />
      )}
      <span className="text-sm leading-none">{item.icon}</span>
      {item.label}
    </Link>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#4A6080" }}>
      {label}
    </p>
  );
}

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [fiscalOpen, setFiscalOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/fiscalite")) setFiscalOpen(true);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserEmail(data.user.email ?? null);
        const meta = data.user.user_metadata;
        setUserFullName(meta?.full_name ?? meta?.name ?? null);
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
  const onFiscalPage = pathname.startsWith("/fiscalite");

  return (
    <aside
      className="w-60 h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0B1A2F 0%, #0d1f38 100%)",
        borderRight: "1px solid #1E3352",
      }}
    >
      {/* Shimmer */}
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #2563EB, transparent)" }} />

      {/* Logo */}
      <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#1E3352" }}>
        <Image src="/logo.png" alt="Easy Location Immo" width={140} height={40} style={{ height: "40px", width: "auto" }} priority />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">

        {/* Principal */}
        <SectionLabel label="Principal" />
        {mainNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}

        {/* Finances */}
        <SectionLabel label="Finances & Fiscalité" />
        {financeNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}

        {/* Fiscalité — accordéon */}
        <button
          onClick={() => setFiscalOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs mt-0.5 transition-all"
          style={{
            color: onFiscalPage ? "#FFFFFF" : "#8BA0BC",
            background: onFiscalPage && !fiscalOpen ? "rgba(37,99,235,0.10)" : "transparent",
            fontWeight: onFiscalPage ? 600 : 400,
          }}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-sm leading-none">📊</span>
            Fiscalité
          </span>
          <span
            className="text-[10px] transition-transform duration-200"
            style={{ transform: fiscalOpen ? "rotate(180deg)" : "rotate(0deg)", color: "#4A6080" }}
          >
            ▼
          </span>
        </button>

        {fiscalOpen && (
          <div className="ml-3 pl-2.5 border-l mt-0.5" style={{ borderColor: "#1E3352" }}>
            {fiscalNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
          </div>
        )}

        {/* Gestion */}
        <SectionLabel label="Gestion" />
        {gestionNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}

      </nav>

      {/* Profil */}
      <div className="px-4 py-3 border-t flex-shrink-0" style={{ borderColor: "#1E3352" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
          >
            {getInitials(userFullName, userEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[11px] font-medium truncate">{displayName}</p>
            <p className="text-[10px] truncate" style={{ color: "#4A6080" }}>Propriétaire</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Déconnexion"
            className="text-xs transition-colors flex-shrink-0"
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
