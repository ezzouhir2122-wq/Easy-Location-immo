"use client";
import { useState } from "react";
import { TVACalculator } from "@/lib/fiscal/engine/TVACalculator";
import { TaxStepCard } from "@/components/fiscal/TaxStepCard";
import { RiskFlag } from "@/components/fiscal/RiskFlag";
import type { TVAInput, TVAResult, AssujettissementTVA } from "@/lib/fiscal/engine/types";

const calc = new TVACalculator();
const CURRENT_YEAR = new Date().getFullYear();

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function TVAPage() {
  const [form, setForm] = useState({
    fiscal_year: CURRENT_YEAR,
    loyer_mensuel_ht: 8_000,
    nb_mois: 12,
    taux_tva: 0.20 as 0.20 | 0.10,
    charges_ht: 0,
    assujettissement: "obligatoire" as AssujettissementTVA,
    type_location: "commerciale" as "commerciale" | "professionnelle",
  });
  const [result, setResult] = useState<TVAResult | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setResult(null);
  }

  function handleCalculer() {
    const input: TVAInput = { ...form, is_simulation: true };
    setResult(calc.calculate(input));
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          TVA sur loyers commerciaux
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Calcul de la TVA collectée et déductible — CGI Art. 89-I-6°, 90, 101, 104
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Paramètres</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Loyer mensuel HT (DH)</label>
                <input
                  type="number" value={form.loyer_mensuel_ht} min={0}
                  onChange={e => setField("loyer_mensuel_ht", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Nombre de mois</label>
                <select
                  value={form.nb_mois}
                  onChange={e => setField("nb_mois", parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[3, 6, 9, 12].map(m => <option key={m} value={m}>{m} mois</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Taux TVA</label>
                <div className="flex gap-2">
                  {([0.20, 0.10] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setField("taux_tva", t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.taux_tva === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {(t * 100).toFixed(0)}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Type de location</label>
                <div className="flex gap-2">
                  {(["commerciale", "professionnelle"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setField("type_location", t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                        form.type_location === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Charges déductibles HT (DH)</label>
                <input
                  type="number" value={form.charges_ht} min={0}
                  onChange={e => setField("charges_ht", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Assujettissement</label>
                <select
                  value={form.assujettissement}
                  onChange={e => setField("assujettissement", e.target.value as AssujettissementTVA)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="obligatoire">Obligatoire (CA ≥ 500 000 DH)</option>
                  <option value="option">Sur option</option>
                  <option value="non_assujetti">Non assujetti</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculer}
              className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Calculer la TVA
            </button>

            {/* Info CA */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 space-y-1">
              <p>CA HT annuel estimé :{" "}
                <strong className="text-slate-600">
                  {fmt(form.loyer_mensuel_ht * form.nb_mois)} DH
                </strong>
              </p>
              <p>Seuil obligatoire : <strong className="text-slate-600">500 000 DH</strong></p>
              <p className="text-slate-500 text-[11px] pt-1">
                Applicable uniquement aux locations commerciales ou professionnelles (Art. 89 CGI)
              </p>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Résumé TVA */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Résumé TVA</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "CA HT annuel", value: result.ca_ht_annuel, color: "#2563EB" },
                    { label: "TVA collectée", value: result.tva_collectee, color: "#EF4444" },
                    { label: "TVA déductible", value: result.tva_deductible, color: "#10B981" },
                    { label: "TVA nette à reverser", value: result.tva_nette, color: result.tva_nette === 0 ? "#10B981" : "#F59E0B" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className="text-lg font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                        {fmt(value)} DH
                      </p>
                    </div>
                  ))}
                </div>

                {result.tva_nette === 0 && result.tva_deductible > result.tva_collectee && (
                  <p className="mt-3 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                    Crédit de TVA de {fmt(result.tva_deductible - result.tva_collectee)} DH — remboursable sur demande (Art. 103 CGI)
                  </p>
                )}
              </div>

              {/* Étapes */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Détail du calcul</h3>
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
              <span className="text-4xl mb-4">🧾</span>
              <p className="text-slate-400 text-sm">Renseignez le loyer mensuel HT et cliquez sur Calculer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
