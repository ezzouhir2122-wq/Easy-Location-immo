"use client";
import { useState } from "react";
import { TaxeHabitationCalculator } from "@/lib/fiscal/engine/TaxeHabitationCalculator";
import { TaxStepCard } from "@/components/fiscal/TaxStepCard";
import { RiskFlag } from "@/components/fiscal/RiskFlag";
import type { TaxeHabitationInput, TaxeHabitationResult } from "@/lib/fiscal/engine/types";

const calc = new TaxeHabitationCalculator();
const CURRENT_YEAR = new Date().getFullYear();

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const TH_BAREME = [
  { label: "0 — 5 000 DH", taux: "0%", deduction: "—" },
  { label: "5 001 — 20 000 DH", taux: "10%", deduction: "0 DH" },
  { label: "20 001 — 40 000 DH", taux: "20%", deduction: "2 000 DH" },
  { label: "> 40 000 DH", taux: "30%", deduction: "6 000 DH" },
];

export default function TaxeHabitationPage() {
  const [form, setForm] = useState({
    fiscal_year: CURRENT_YEAR,
    vla_annuelle: 24_000,
    residence_principale: false,
    nb_personnes_charge: 0,
  });
  const [result, setResult] = useState<TaxeHabitationResult | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setResult(null);
  }

  function handleCalculer() {
    const input: TaxeHabitationInput = { ...form, is_simulation: true };
    setResult(calc.calculate(input));
  }

  const loyerMensuelEquiv = Math.round(form.vla_annuelle / 12);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Taxe d&apos;Habitation (TH)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Barème progressif sur la Valeur Locative Annuelle — CGI Art. 30 à 42, LF 2026
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Paramètres</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  VLA annuelle (Valeur Locative Annuelle) — DH
                </label>
                <input
                  type="number" value={form.vla_annuelle} min={0} step={1000}
                  onChange={e => setField("vla_annuelle", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ≈ {fmt(loyerMensuelEquiv)} DH/mois (loyer mensuel équivalent)
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Année fiscale</label>
                <select
                  value={form.fiscal_year}
                  onChange={e => setField("fiscal_year", parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-2">Résidence principale</label>
                <div className="flex gap-2">
                  {([true, false] as const).map(v => (
                    <button
                      key={String(v)}
                      onClick={() => setField("residence_principale", v)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.residence_principale === v
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {v ? "Oui (abattement 75%)" : "Non"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Personnes à charge (max 6 — 360 DH/personne)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setField("nb_personnes_charge", Math.max(0, form.nb_personnes_charge - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 font-medium"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-slate-800 w-6 text-center">
                    {form.nb_personnes_charge}
                  </span>
                  <button
                    onClick={() => setField("nb_personnes_charge", Math.min(6, form.nb_personnes_charge + 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 font-medium"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400">
                    = {fmt(Math.min(form.nb_personnes_charge, 6) * 360)} DH
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculer}
              className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Calculer la TH
            </button>
          </div>

          {/* Barème référence */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Barème TH 2026 — Art. 31 CGI
            </h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-2 text-left">Tranche VLA</th>
                  <th className="pb-2 text-center">Taux</th>
                  <th className="pb-2 text-right">Déduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {TH_BAREME.map(row => (
                  <tr key={row.label} className="py-1">
                    <td className="py-1.5 text-slate-600">{row.label}</td>
                    <td className="py-1.5 text-center font-medium text-slate-700">{row.taux}</td>
                    <td className="py-1.5 text-right text-slate-500">{row.deduction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Résumé */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Résumé TH</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "VLA annuelle", value: result.vla, color: "#2563EB" },
                    { label: "TH brut", value: result.th_brut, color: "#F59E0B" },
                    { label: "Abattements totaux", value: result.abattement_rp + result.abattement_familial, color: "#10B981" },
                    { label: "TH net à payer", value: result.th_net, color: result.th_net === 0 ? "#10B981" : "#EF4444" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className="text-lg font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                        {fmt(value)} DH
                      </p>
                    </div>
                  ))}
                </div>

                {result.th_net === 0 && (
                  <p className="mt-3 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                    Exonération totale après abattements — TH = 0 DH
                  </p>
                )}
              </div>

              {/* Détail abattements */}
              {(result.abattement_rp > 0 || result.abattement_familial > 0) && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Abattements appliqués</h3>
                  <div className="space-y-2 text-sm">
                    {result.abattement_rp > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500">Résidence principale (75%) — Art. 35</span>
                        <span className="font-bold text-emerald-600">− {fmt(result.abattement_rp)} DH</span>
                      </div>
                    )}
                    {result.abattement_familial > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-slate-500">Personnes à charge — Art. 36</span>
                        <span className="font-bold text-emerald-600">− {fmt(result.abattement_familial)} DH</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Étapes */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Détail des 5 étapes</h3>
                  <button onClick={() => setExpandAll(e => !e)} className="text-xs text-blue-600 hover:underline">
                    {expandAll ? "Réduire" : "Tout afficher"}
                  </button>
                </div>
                <div className="space-y-2">
                  {result.steps.map(s => (
                    <TaxStepCard key={s.step_number} step={s} expanded={expandAll} />
                  ))}
                </div>
              </div>

              {/* Risques */}
              {result.risques_fiscaux.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Alertes fiscales</h3>
                  <div className="space-y-2">
                    {result.risques_fiscaux.map(r => (
                      <RiskFlag key={r.code} flag={r} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-4xl mb-4">🏠</span>
              <p className="text-slate-400 text-sm">
                Renseignez la VLA et cliquez sur Calculer
              </p>
              <p className="text-[11px] text-slate-300 mt-2">
                VLA = loyer mensuel × 12 (estimation)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
