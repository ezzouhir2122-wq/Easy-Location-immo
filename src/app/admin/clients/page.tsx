import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminClientsPage() {
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase.from("profiles").select("id, email, nom, prenom, role, status, created_at").eq("role", "client").order("created_at", { ascending: false });

  return (
    <div>
      <a href="/admin" className="text-sm text-blue-300">← Administration</a>
      <h2 className="mt-3 text-3xl font-bold">Clients</h2>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="grid grid-cols-[1fr_1fr_120px] gap-4 border-b border-white/10 px-5 py-3 text-xs uppercase tracking-wide text-slate-400">
          <span>Client</span><span>Inscription</span><span>Statut</span>
        </div>
        {(clients ?? []).map((client) => (
          <div key={client.id} className="grid grid-cols-[1fr_1fr_120px] gap-4 border-b border-white/5 px-5 py-4 text-sm last:border-0">
            <div><p>{client.email}</p><p className="text-xs text-slate-400">{client.prenom} {client.nom}</p></div>
            <span className="text-slate-300">{new Date(client.created_at).toLocaleDateString("fr-FR")}</span>
            <span className={client.status === "active" ? "text-emerald-300" : "text-red-300"}>{client.status}</span>
          </div>
        ))}
        {!clients?.length && <p className="px-5 py-8 text-sm text-slate-400">Aucun client inscrit.</p>}
      </div>
    </div>
  );
}
