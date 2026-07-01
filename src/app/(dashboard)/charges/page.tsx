"use client";
import { useEffect, useState } from "react";
import { Charge, getCharges, deleteCharge } from "@/lib/supabase/charges";
import ChargeForm from "@/components/charges/ChargeForm";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

const TYPE_LABELS: Record<string, string> = {
  eau: "Eau", electricite: "Électricité", internet: "Internet",
  assurance: "Assurance", entretien: "Entretien", taxe: "Taxe", autre: "Autre",
};
const TYPE_ICONS: Record<string, string> = {
  eau: "💧", electricite: "⚡", internet: "🌐",
  assurance: "🛡️", entretien: "🔧", taxe: "📋", autre: "📌",
};

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Charge | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setCharges(await getCharges()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(c: Charge) { setEditTarget(c); setFormOpen(true); }

  async function handleDelete(c: Charge) {
    if (!confirm(`Supprimer cette charge de ${c.montant} DH ?`)) return;
    try {
      await deleteCharge(c.id);
      setCharges(prev => prev.filter(x => x.id !== c.id));
      setToast({ message: "Charge supprimée", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(c: Charge) {
    setFormOpen(false);
    setCharges(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? c : x) : [c, ...prev];
    });
    setToast({ message: editTarget ? "Charge mise à jour" : "Charge ajoutée", type: "success" });
    setEditTarget(undefined);
  }

  const totalPaye = charges.filter(c => c.statut === "paye").reduce((s, c) => s + c.montant, 0);
  const totalAttente = charges.filter(c => c.statut === "en_attente").reduce((s, c) => s + c.montant, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Charges</h1>
          <p className="text-slate-500 text-sm mt-1">Eau, électricité, assurance, entretien...</p>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>
          + Ajouter une charge
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Charges payées", value: totalPaye, color: "#10B981", bg: "#D1FAE5" },
          { label: "En attente", value: totalAttente, color: "#F59E0B", bg: "#FEF3C7" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
              {value.toLocaleString("fr-FR")} DH
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "#F1F5F9" }} />)}</div>
      ) : charges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Aucune charge enregistrée</h3>
          <p className="text-slate-400 text-sm mb-6">Suivez vos dépenses liées à vos biens immobiliers</p>
          <button onClick={handleAdd} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>+ Ajouter une charge</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Bien</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Description</th>
                <th className="text-right text-xs font-semibold text-slate-400 px-5 py-3">Montant</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {charges.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition" style={{ borderBottom: i === charges.length - 1 ? "none" : undefined }}>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <span>{TYPE_ICONS[c.type]}</span>{TYPE_LABELS[c.type] ?? c.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{c.bien_nom ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{c.description || "—"}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{c.montant.toLocaleString("fr-FR")} DH</td>
                  <td className="px-5 py-3.5 text-slate-500">{new Date(c.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={c.statut === "paye" ? { background: "#D1FAE5", color: "#065F46" } : { background: "#FEF3C7", color: "#92400E" }}>
                      {c.statut === "paye" ? "Payé" : "En attente"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleEdit(c)} className="text-xs text-blue-600 hover:text-blue-800 font-medium transition">Modifier</button>
                      <button onClick={() => handleDelete(c)} className="text-xs text-red-400 hover:text-red-600 font-medium transition">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SlideOver open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(undefined); }} title={editTarget ? "Modifier la charge" : "Ajouter une charge"}>
        <ChargeForm charge={editTarget} onSuccess={handleSuccess} onError={msg => setToast({ message: msg, type: "error" })} />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
