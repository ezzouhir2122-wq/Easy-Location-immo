import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ count: clients }, { count: subscriptions }, { count: activeClients }, { data: recentClients }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client").eq("status", "active"),
    supabase.from("profiles").select("id, email, nom, prenom, status, created_at").eq("role", "client").order("created_at", { ascending: false }).limit(5),
  ]);

  return (
    <div className="admin-ocean">
      <div className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-transparent p-7 shadow-2xl shadow-cyan-950/20">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">Centre de contrôle</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Bonjour administrateur</h2><p className="mt-2 text-sm text-slate-300">Pilotez les clients, les abonnements et la croissance de votre SaaS.</p></div><Link href="/admin/clients" className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Voir les clients →</Link></div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clients inscrits" value={clients ?? 0} accent="cyan" href="/admin/clients" />
        <Stat label="Clients actifs" value={activeClients ?? 0} accent="blue" href="/admin/clients" />
        <Stat label="Abonnements actifs" value={subscriptions ?? 0} accent="violet" href="/admin/subscriptions" />
        <Stat label="Taux d’activation" value={clients ? `${Math.round(((activeClients ?? 0) / clients) * 100)}%` : "0%"} accent="emerald" href="/admin/clients" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold">Derniers clients</h3><p className="mt-1 text-xs text-slate-400">Les comptes les plus récemment créés</p></div><Link href="/admin/clients" className="text-xs font-semibold text-cyan-300">Tout voir</Link></div><div className="mt-5 divide-y divide-white/10">{(recentClients ?? []).map((client) => <div key={client.id} className="flex items-center justify-between gap-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">{(client.prenom?.[0] ?? client.email[0]).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{client.prenom || client.nom ? `${client.prenom ?? ""} ${client.nom ?? ""}` : client.email}</p><p className="truncate text-xs text-slate-400">{client.email}</p></div></div><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold text-emerald-300">{client.status}</span></div>)}{!recentClients?.length && <p className="py-8 text-sm text-slate-400">Aucun client pour le moment.</p>}</div></section>
        <section className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><h3 className="font-bold">Actions rapides</h3><div className="mt-4 grid gap-3"><Link href="/admin/clients" className="rounded-xl border border-white/10 bg-white/[.05] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"><p className="text-sm font-semibold">Gérer les clients</p><p className="mt-1 text-xs text-slate-400">Statuts et comptes</p></Link><Link href="/admin/subscriptions" className="rounded-xl border border-white/10 bg-white/[.05] p-4 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"><p className="text-sm font-semibold">Gérer les abonnements</p><p className="mt-1 text-xs text-slate-400">Plans et activations</p></Link></div></section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, href }: { label: string; value: string | number; accent: string; href: string }) {
  const colors: Record<string, string> = { cyan: "#67e8f9", blue: "#60a5fa", violet: "#c4b5fd", emerald: "#6ee7b7" };
  return <Link href={href} className="group rounded-2xl border border-white/10 bg-white/[.06] p-5 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[.09]"><span className="block h-1 w-10 rounded-full" style={{ background: colors[accent] }} /><p className="mt-4 text-xs text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold" style={{ color: colors[accent] }}>{value}</p><p className="mt-2 text-[11px] text-slate-500 group-hover:text-cyan-300">Ouvrir le détail →</p></Link>;
}
