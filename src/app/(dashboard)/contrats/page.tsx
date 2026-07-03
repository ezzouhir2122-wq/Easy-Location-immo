"use client";
import { useEffect, useState } from "react";
import { Contrat, getContrats, deleteContrat, StatutContrat } from "@/lib/supabase/contrats";
import ContratForm from "@/components/contrats/ContratForm";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

const STATUT_CONFIG: Record<StatutContrat, { label: string; color: string; bg: string }> = {
  actif:      { label: "Actif",      color: "#10B981", bg: "#D1FAE5" },
  en_attente: { label: "En attente", color: "#2563EB", bg: "#DBEAFE" },
  termine:    { label: "Terminé",    color: "#64748B", bg: "#F1F5F9" },
  resilie:    { label: "Résilié",    color: "#EF4444", bg: "#FEE2E2" },
};

const TYPE_BAIL_LABELS: Record<string, string> = {
  vide:       "Location vide",
  meuble:     "Meublé",
  commercial: "Commercial",
  saisonnier: "Saisonnier",
  autre:      "Autre",
};

function StatutBadge({ statut }: { statut: StatutContrat }) {
  const { label, color, bg } = STATUT_CONFIG[statut] ?? STATUT_CONFIG.actif;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color, background: bg }}>
      {label}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ContratsPage() {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contrat | undefined>(undefined);
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setContrats(await getContrats()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(c: Contrat) { setEditTarget(c); setFormOpen(true); }

  async function handleDelete(c: Contrat) {
    if (!confirm(`Supprimer le contrat de ${c.locataire_nom ?? "ce locataire"} ?`)) return;
    try {
      await deleteContrat(c.id);
      setContrats(prev => prev.filter(x => x.id !== c.id));
      setToast({ message: "Contrat supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(c: Contrat) {
    setFormOpen(false);
    setContrats(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? c : x) : [c, ...prev];
    });
    setToast({ message: editTarget ? "Contrat mis à jour" : "Contrat créé", type: "success" });
    setEditTarget(undefined);
  }

  const filtered = filterStatut === "tous" ? contrats : contrats.filter(c => c.statut === filterStatut);

  const nbActifs = contrats.filter(c => c.statut === "actif").length;
  const loyerTotal = contrats.filter(c => c.statut === "actif").reduce((s, c) => s + c.loyer_mensuel, 0);
  const nbEnAttente = contrats.filter(c => c.statut === "en_attente").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Contrats
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestion des baux et contrats de location</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Nouveau contrat
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Contrats actifs</p>
          <p className="text-2xl font-bold text-emerald-500" style={{ fontFamily: "Syne, sans-serif" }}>
            {nbActifs}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">Loyers mensuels (actifs)</p>
          <p className="text-2xl font-bold text-blue-600" style={{ fontFamily: "Syne, sans-serif" }}>
            {loyerTotal.toLocaleString("fr-FR")} DH
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-400 mb-1">En attente de signature</p>
          <p className="text-2xl font-bold text-amber-500" style={{ fontFamily: "Syne, sans-serif" }}>
            {nbEnAttente}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {(["tous", "actif", "en_attente", "termine", "resilie"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              background: filterStatut === s ? "#0B1A2F" : "#F1F5F9",
              color: filterStatut === s ? "#fff" : "#64748B",
            }}
          >
            {s === "tous" ? "Tous" : STATUT_CONFIG[s as StatutContrat]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            {filterStatut === "tous" ? "Aucun contrat enregistré" : "Aucun contrat dans cette catégorie"}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            Créez un contrat pour lier un bien à un locataire
          </p>
          {filterStatut === "tous" && (
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              + Nouveau contrat
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Bien</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Locataire</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Période</th>
                <th className="text-right text-xs font-semibold text-slate-400 px-5 py-3">Loyer / mois</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition"
                  style={{ borderBottom: i === filtered.length - 1 ? "none" : undefined }}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{c.bien_nom ?? "—"}</p>
                    {c.bien_adresse && (
                      <p className="text-xs text-slate-400 mt-0.5">{c.bien_adresse}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-700">{c.locataire_nom ?? "—"}</p>
                    {c.locataire_telephone && (
                      <p className="text-xs text-slate-400 mt-0.5">{c.locataire_telephone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    <span>{formatDate(c.date_debut)}</span>
                    <span className="mx-1 text-slate-300">→</span>
                    <span>{formatDate(c.date_fin)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                    {c.loyer_mensuel.toLocaleString("fr-FR")} DH
                    {c.charges_mensuelles > 0 && (
                      <p className="text-xs text-slate-400 font-normal">+{c.charges_mensuelles.toLocaleString("fr-FR")} ch.</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {TYPE_BAIL_LABELS[c.type_bail] ?? c.type_bail}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatutBadge statut={c.statut} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        title={editTarget ? "Modifier le contrat" : "Nouveau contrat"}
      >
        <ContratForm
          contrat={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
