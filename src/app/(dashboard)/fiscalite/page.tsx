"use client";
import { useEffect, useState } from "react";
import { getLoyers } from "@/lib/supabase/loyers";
import { getCharges } from "@/lib/supabase/charges";

export default function FiscalitePage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [revenus, setRevenus] = useState(0);
  const [charges, setCharges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [loyers, chgs] = await Promise.all([getLoyers(), getCharges()]);
        const rev = loyers
          .filter(l => l.statut === "paye" && new Date(l.date_echeance).getFullYear() === annee)
          .reduce((s, l) => s + l.montant, 0);
        const chg = chgs
          .filter(c => c.statut === "paye" && new Date(c.date).getFullYear() === annee)
          .reduce((s, c) => s + c.montant, 0);
        setRevenus(rev);
        setCharges(chg);
      } finally { setLoading(false); }
    }
    load();
  }, [annee]);

  const revenuNet = revenus - charges;
  const impotEstime = revenuNet > 0 ? revenuNet * 0.15 : 0;

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Fiscalité</h1>
          <p className="text-slate-500 text-sm mt-1">Récapitulatif fiscal de votre activité locative</p>
        </div>
        <select
          value={annee}
          onChange={e => setAnnee(parseInt(e.target.value))}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: "#F1F5F9" }} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "Revenus locatifs bruts", value: revenus, color: "#10B981" },
              { label: "Charges déductibles", value: charges, color: "#EF4444" },
              { label: "Revenu net imposable", value: revenuNet, color: "#2563EB" },
              { label: "Impôt estimé (15%)", value: impotEstime, color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                  {value.toLocaleString("fr-FR")} DH
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
              Informations fiscales — Maroc {annee}
            </h2>
            <div className="space-y-3 text-sm text-slate-600">
              {[
                ["Régime applicable", "Revenus fonciers — IR"],
                ["Taux forfaitaire", "15% (si revenus bruts annuels ≤ 120 000 DH)"],
                ["Abattement charges", "40% sur les revenus bruts en régime forfaitaire"],
                ["Déclaration annuelle", "Avant le 31 mars de l'année suivante"],
                ["Organisme", "Direction Générale des Impôts (DGI)"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
                  <span className="text-slate-400 text-xs">{k}</span>
                  <span className="font-medium text-slate-700 text-xs text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
              * Estimation indicative uniquement. Consultez un expert-comptable pour votre déclaration officielle.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
