"use client";

import { useMemo, useState } from "react";

type Client = { id: string; email: string; nom: string | null; prenom: string | null; status: string; created_at: string };

export default function ClientManagement({ clients }: { clients: Client[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState(clients);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => items.filter((client) => {
    const text = `${client.email} ${client.nom ?? ""} ${client.prenom ?? ""}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (status === "all" || client.status === status);
  }), [items, query, status]);

  async function updateStatus(id: string, nextStatus: "active" | "suspended") {
    setBusy(id); setMessage("");
    const response = await fetch("/api/admin/clients", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
    if (!response.ok) setMessage("Impossible de modifier ce client. Vérifiez la migration RLS.");
    else setItems((current) => current.map((client) => client.id === id ? { ...client, status: nextStatus } : client));
    setBusy(null);
  }

  const active = items.filter((client) => client.status === "active").length;
  const suspended = items.filter((client) => client.status === "suspended").length;

  return <div>
    <a href="/admin" className="text-sm text-cyan-300">← Administration</a>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Base clients</p><h2 className="mt-2 text-3xl font-bold">Clients</h2><p className="mt-1 text-sm text-slate-400">Gérez les accès à votre plateforme SaaS.</p></div><div className="flex gap-2 text-xs"><span className="rounded-full bg-emerald-400/10 px-3 py-2 text-emerald-300">{active} actifs</span><span className="rounded-full bg-red-400/10 px-3 py-2 text-red-300">{suspended} suspendus</span></div></div>
    <div className="mt-7 flex flex-wrap gap-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un client..." className="min-w-[240px] flex-1 rounded-xl border border-white/10 bg-white/[.07] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-sm text-white outline-none"><option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="suspended">Suspendus</option></select></div>
    {message && <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-200">{message}</p>}
    <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[.05]"><div className="hidden grid-cols-[1fr_150px_120px_150px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Client</span><span>Inscription</span><span>Statut</span><span>Action</span></div>{filtered.map((client) => <div key={client.id} className="grid gap-3 border-b border-white/10 px-5 py-4 last:border-0 md:grid-cols-[1fr_150px_120px_150px] md:items-center md:gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold">{(client.prenom?.[0] ?? client.email[0]).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{client.prenom || client.nom ? `${client.prenom ?? ""} ${client.nom ?? ""}` : "Client sans nom"}</p><p className="truncate text-xs text-slate-400">{client.email}</p></div></div><span className="text-xs text-slate-400">{new Date(client.created_at).toLocaleDateString("fr-FR")}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${client.status === "active" ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>{client.status}</span><button disabled={busy === client.id} onClick={() => updateStatus(client.id, client.status === "active" ? "suspended" : "active")} className="w-fit rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 disabled:opacity-50">{busy === client.id ? "..." : client.status === "active" ? "Suspendre" : "Réactiver"}</button></div>)}{!filtered.length && <p className="px-5 py-10 text-sm text-slate-400">Aucun client correspondant.</p>}</div>
  </div>;
}
