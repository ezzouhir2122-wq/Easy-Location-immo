"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FiBarChart2, FiCalendar, FiCheckSquare, FiChevronDown, FiDollarSign, FiFileText, FiFolder, FiHome, FiSettings, FiUsers } from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";

type Icon = React.ComponentType<{ size?: number; strokeWidth?: number }>;
type NavItem = { href: string; icon: Icon; label: string; exact?: boolean };

const mainNav: NavItem[] = [
  { href: "/dashboard", icon: FiBarChart2, label: "Tableau de bord" },
  { href: "/biens", icon: FiHome, label: "Biens" },
  { href: "/locataires", icon: FiUsers, label: "Locataires" },
  { href: "/contrats", icon: FiFileText, label: "Contrats" },
  { href: "/reservations", icon: FiCalendar, label: "Réservations" },
  { href: "/calendrier", icon: FiCalendar, label: "Calendrier" },
  { href: "/taches", icon: FiCheckSquare, label: "Tâches" },
];
const financeNav: NavItem[] = [
  { href: "/loyers", icon: FiDollarSign, label: "Loyers" },
  { href: "/charges", icon: FiBarChart2, label: "Charges" },
  { href: "/comptabilite", icon: FiFileText, label: "Comptabilité" },
  { href: "/etats", icon: FiBarChart2, label: "États par bien" },
];
const fiscalNav: NavItem[] = [
  { href: "/fiscalite", icon: FiBarChart2, label: "Dashboard fiscal", exact: true },
  { href: "/fiscalite/calculateur", icon: FiBarChart2, label: "Calculateur IR" },
  { href: "/fiscalite/declaration", icon: FiFileText, label: "Déclaration" },
  { href: "/fiscalite/tva", icon: FiFileText, label: "TVA" },
  { href: "/fiscalite/taxe-habitation", icon: FiHome, label: "Taxe d'habitation" },
  { href: "/fiscalite/tsc", icon: FiBarChart2, label: "TSC" },
  { href: "/fiscalite/audit", icon: FiCheckSquare, label: "Audit" },
  { href: "/fiscalite/historique", icon: FiFileText, label: "Historique" },
  { href: "/fiscalite/configuration", icon: FiSettings, label: "Configuration" },
];
const gestionNav: NavItem[] = [
  { href: "/documents", icon: FiFolder, label: "Documents" },
  { href: "/parametres", icon: FiSettings, label: "Paramètres" },
];

function SectionLabel({ label }: { label: string }) {
  return <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#607694" }}>{label}</p>;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;
  return <Link href={item.href} className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/[.06]" style={{ color: active ? "#FFFFFF" : "#A1B2C8", background: active ? "rgba(37,99,235,.18)" : "transparent", fontWeight: active ? 600 : 400 }}>
    {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-blue-500" />}
    <Icon size={15} strokeWidth={1.8} />{item.label}
  </Link>;
}

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [fiscalOpen, setFiscalOpen] = useState(pathname.startsWith("/fiscalite"));

  useEffect(() => { if (pathname.startsWith("/fiscalite")) setFiscalOpen(true); }, [pathname]);
  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (data.user) { setUserEmail(data.user.email ?? null); const meta = data.user.user_metadata; setUserFullName(meta?.full_name ?? meta?.name ?? null); } }); }, []);
  async function handleSignOut() { await createClient().auth.signOut(); window.location.href = "/login"; }
  const displayName = userFullName ?? userEmail ?? "Propriétaire";
  const initials = userFullName ? userFullName.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase() : (userEmail?.slice(0, 2).toUpperCase() ?? "?");
  const onFiscalPage = pathname.startsWith("/fiscalite");

  return <aside className="flex h-screen w-60 flex-col" style={{ background: "linear-gradient(180deg,#0B1A2F 0%,#0d1f38 100%)", borderRight: "1px solid #1E3352" }}>
    <div className="h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    <div className="flex-shrink-0 border-b px-5 py-3" style={{ borderColor: "#1E3352" }}><Image src="/logo.png" alt="Easy Location Immo" width={140} height={40} style={{ height: 40, width: "auto" }} priority /></div>
    <nav className="flex-1 overflow-y-auto px-2 py-2">
      <SectionLabel label="Principal" />{mainNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
      <SectionLabel label="Finances" />{financeNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
      <button onClick={() => setFiscalOpen(o => !o)} aria-expanded={fiscalOpen} className="mt-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/[.06]" style={{ color: onFiscalPage ? "#FFFFFF" : "#A1B2C8", fontWeight: onFiscalPage ? 600 : 400 }}><span className="flex items-center gap-2.5"><FiBarChart2 size={15} strokeWidth={1.8} />Fiscalité</span><FiChevronDown size={13} className={`transition-transform ${fiscalOpen ? "rotate-180" : ""}`} /></button>
      {fiscalOpen && <div className="ml-3 mt-0.5 border-l pl-2.5" style={{ borderColor: "#1E3352" }}>{fiscalNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}</div>}
      <SectionLabel label="Gestion" />{gestionNav.map(item => <NavLink key={item.href} item={item} pathname={pathname} />)}
    </nav>
    <div className="flex-shrink-0 border-t px-4 py-3" style={{ borderColor: "#1E3352" }}><div className="flex items-center gap-2.5"><div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-[10px] font-bold text-white">{initials}</div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-medium text-white">{displayName}</p><p className="truncate text-[10px]" style={{ color: "#607694" }}>Propriétaire</p></div><button onClick={handleSignOut} title="Déconnexion" aria-label="Déconnexion" className="text-[#607694] transition-colors hover:text-red-400"><span aria-hidden="true">↪</span></button></div></div>
  </aside>;
}
