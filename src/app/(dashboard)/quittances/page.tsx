"use client";
import { useEffect, useState } from "react";
import { getLoyers, Loyer } from "@/lib/supabase/loyers";

export default function QuittancesPage() {
  const [quittances, setQuittances] = useState<Loyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoyers().then(all => {
      setQuittances(all.filter(l => l.statut === "paye" && l.type === "loyer"));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function handlePrint(q: Loyer) {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Quittance de loyer</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #1e293b; }
        h1 { font-size: 22px; border-bottom: 2px solid #2563EB; padding-bottom: 8px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .label { color: #64748b; font-size: 13px; }
        .value { font-weight: 600; font-size: 13px; }
        .total { font-size: 18px; font-weight: bold; color: #2563EB; margin-top: 20px; }
        footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: center; }
      </style></head><body>
      <h1>Quittance de loyer</h1>
      <div class="row"><span class="label">Bien</span><span class="value">${q.bien_nom ?? "—"}</span></div>
      <div class="row"><span class="label">Locataire</span><span class="value">${q.locataire_nom ?? "—"}</span></div>
      <div class="row"><span class="label">Période</span><span class="value">${new Date(q.date_echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span></div>
      <div class="row"><span class="label">Date de paiement</span><span class="value">${q.date_paiement ? new Date(q.date_paiement).toLocaleDateString("fr-FR") : "—"}</span></div>
      <div class="total">Montant reçu : ${q.montant.toLocaleString("fr-FR")} DH</div>
      <footer>Quittance générée par Easy Location Immo</footer>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Quittances</h1>
        <p className="text-slate-500 text-sm mt-1">Quittances générées automatiquement pour les loyers payés</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "#F1F5F9" }} />)}</div>
      ) : quittances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🧾</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Aucune quittance disponible</h3>
          <p className="text-slate-400 text-sm">Les quittances apparaissent automatiquement quand un loyer est marqué comme payé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Bien</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Locataire</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Période</th>
                <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Payé le</th>
                <th className="text-right text-xs font-semibold text-slate-400 px-5 py-3">Montant</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {quittances.map((q, i) => (
                <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 transition" style={{ borderBottom: i === quittances.length - 1 ? "none" : undefined }}>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{q.bien_nom ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{q.locataire_nom ?? "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500 capitalize">
                    {new Date(q.date_echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {q.date_paiement ? new Date(q.date_paiement).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{q.montant.toLocaleString("fr-FR")} DH</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handlePrint(q)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium transition flex items-center gap-1 ml-auto"
                    >
                      🖨️ Imprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
