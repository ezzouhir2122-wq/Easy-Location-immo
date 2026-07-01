"use client";
import { useEffect, useState } from "react";
import { Loyer, getLoyers, deleteLoyer } from "@/lib/supabase/loyers";
import LoyerForm from "@/components/loyers/LoyerForm";
import LoyerStatusBadge from "@/components/loyers/LoyerStatusBadge";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

const TYPE_LABELS: Record<string, string> = {
  loyer: "Loyer",
  charge: "Charge",
  depot_garantie: "Dépôt",
  autre: "Autre",
};

export default function LoyersPage() {
  const [loyers, setLoyers] = useState<Loyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Loyer | undefined>(undefined);
  const [filterStatut, setFilterStatut] = useState<string>("tous");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setLoyers(await getLoyers()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(l: Loyer) { setEditTarget(l); setFormOpen(true); }

  async function handleDelete(l: Loyer) {
    if (!confirm(`Supprimer ce paiement de ${l.montant} € ?`)) return;
    try {
      await deleteLoyer(l.id);
      setLoyers(prev => prev.filter(x => x.id !== l.id));
      setToast({ message: "Paiement supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(l: Loyer) {
    setFormOpen(false);
    setLoyers(prev => {
      const idx = prev.findIndex(x => x.id === l.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? l : x) : [l, ...prev];
    });
    setToast({ message: editTarget ? "Paiement mis à jour" : "Paiement enregistré", type: "success" });
    setEditTarget(undefined);
  }

  const filtered = filterStatut === "tous" ? loyers : loyers.filter(l => l.statut === filterStatut);

  const totalPaye = loyers.filter(l => l.statut === "paye").reduce((s, l) => s + l.montant, 0);
  const totalAttente = loyers.filter(l => l.statut === "en_attente").reduce((s, l) => s + l.montant, 0);
  const totalRetard = loyers.filter(l => l.statut === "retard").reduce((s, l) => s + l.montant, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Loyers
          </h1>
          <p className="text-slate-500 text-sm mt-1">Suivi des paiements et encaissements</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Enregistrer un paiement
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Encaissé", value: totalPaye, color: "#10B981", bg: "#D1FAE5" },
          { label: "En attente", value: totalAttente, color: "#2563EB", bg: "#DBEAFE" },
          { label: "En retard", value: totalRetard, color: "#EF4444", bg: "#FEE2E2" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
              {value.toLocaleString("fr-FR")} €
            </p>
          </div>
        ))}
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-5">
        {["tous", "paye", "en_attente", "retard", "partiel"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
            style={{
              background: filterStatut === s ? "#0B1A2F" : "#F1F5F9",
              color: filterStatut === s ? "#fff" : "#64748B",
            }}
          >
            {s === "tous" ? "Tous" : s === "paye" ? "Payés" : s === "en_attente" ? "En attente" : s === "retard" ? "Retard" : "Partiel"}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">💰</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            {filterStatut === "tous" ? "Aucun paiement enregistré" : "Aucun paiement dans cette catégorie"}
          </h3>
          <p className="text-slate-400 text-sm mb-6">Enregistrez les loyers perçus pour suivre vos encaissements</p>
          {filterStatut === "tous" && (
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              + Enregistrer un paiement
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
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Type</th>
                <th className="text-right text-xs font-semibold text-slate-400 px-5 py-3">Montant</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Échéance</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Paiement</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr
                  key={l.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition"
                  style={{ borderBottom: i === filtered.length - 1 ? "none" : undefined }}
                >
                  <td className="px-5 py-3.5 font-medium text-slate-800">{l.bien_nom ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{l.locataire_nom ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{TYPE_LABELS[l.type] ?? l.type}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                    {l.montant.toLocaleString("fr-FR")} €
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(l.date_echeance).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {l.date_paiement ? new Date(l.date_paiement).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <LoyerStatusBadge statut={l.statut} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(l)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(l)}
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
        title={editTarget ? "Modifier le paiement" : "Enregistrer un paiement"}
      >
        <LoyerForm
          loyer={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
