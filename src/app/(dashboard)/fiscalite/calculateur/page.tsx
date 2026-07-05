"use client";
import { useState, useEffect, useRef } from "react";
import { useTaxCalculation } from "@/hooks/useTaxCalculation";
import { TaxStepCard } from "@/components/fiscal/TaxStepCard";
import { TaxResultSummary } from "@/components/fiscal/TaxResultSummary";
import { ExemptionBadge } from "@/components/fiscal/ExemptionBadge";
import { RiskFlag } from "@/components/fiscal/RiskFlag";
import type { TaxInput, Regime } from "@/lib/fiscal/engine/types";

const CURRENT_YEAR = new Date().getFullYear();

function buildInput(form: {
  loyerMensuel: number; annee: number; regime: Regime;
  travaux: number; interets: number; assurances: number;
}): TaxInput {
  const paiements = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`, date: `${form.annee}-${String(i + 1).padStart(2, "0")}-01`,
    montant: form.loyerMensuel, statut: "paye" as const
  }));
  return {
    fiscal_year: form.annee,
    bien: {
      id: "manual", type: "appartement", usage: "habitation",
      adresse: "", ville: "", valeur_acquisition: 0,
      date_acquisition: "2020-01-01", surface: 0, quote_part: 1.0
    },
    contrat: {
      loyer_mensuel: form.loyerMensuel, charges_mensuelles: 0,
      avances: 0, date_debut: `${form.annee}-01-01`,
      type_bail: "habitation", paiements
    },
    deductions: { travaux: form.travaux, interets_emprunts: form.interets, assurances: form.assurances, frais_gestion: 0, autres: 0 },
    options: { regime: form.regime, is_simulation: false }
  };
}

export default function CalculateurPage() {
  const [form, setForm] = useState({
    loyerMensuel: 5000, annee: CURRENT_YEAR,
    regime: "forfaitaire" as Regime,
    travaux: 0, interets: 0, assurances: 0,
  });
  const [expandAll, setExpandAll] = useState(false);
  const { result, loading, error, calculate, reset } = useTaxCalculation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calcul automatique à chaque changement de formulaire (debounce 400ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calculate(buildInput(form), false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    await calculate(buildInput(form), true);
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Calculateur IR Foncier
        </h1>
        <p className="text-slate-500 text-sm mt-1">Calcul détaillé en 14 étapes — CGI Maroc</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Paramètres</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Loyer mensuel (DH)</label>
                <input
                  type="number" value={form.loyerMensuel} min={0}
                  onChange={e => setField("loyerMensuel", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Année fiscale</label>
                <select
                  value={form.annee}
                  onChange={e => setField("annee", parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Régime</label>
                <div className="flex gap-2">
                  {(["forfaitaire", "reel"] as Regime[]).map(r => (
                    <button
                      key={r}
                      onClick={() => setField("regime", r)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.regime === r
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      {r === "forfaitaire" ? "Forfaitaire" : "Réel"}
                    </button>
                  ))}
                </div>
              </div>

              {form.regime === "reel" && (
                <>
                  {[
                    { key: "travaux" as const, label: "Travaux (DH)" },
                    { key: "interets" as const, label: "Intérêts emprunts (DH)" },
                    { key: "assurances" as const, label: "Assurances (DH)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-1">{label}</label>
                      <input
                        type="number" value={form[key]} min={0}
                        onChange={e => setField(key, Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className={`w-2 h-2 rounded-full ${loading ? "bg-amber-400 animate-pulse" : result ? "bg-green-500" : "bg-slate-300"}`} />
                <span className="text-xs text-slate-500">{loading ? "Calcul en cours…" : result ? "Résultat mis à jour" : "Renseignez les paramètres"}</span>
              </div>
              <button
                onClick={handleSave}
                disabled={loading || !result}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:border-blue-300 disabled:opacity-30 transition-colors"
                title="Sauvegarder dans l'historique"
              >
                💾
              </button>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <TaxResultSummary result={result} />

              {/* Étapes */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Détail des 14 étapes</h3>
                  <button
                    onClick={() => setExpandAll(e => !e)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {expandAll ? "Réduire" : "Tout afficher"}
                  </button>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {result.steps.map(s => (
                    <TaxStepCard key={s.step_number} step={s} expanded={expandAll} />
                  ))}
                </div>
              </div>

              {/* Exonérations */}
              {result.exemptions_appliquees.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Exonérations vérifiées</h3>
                  <div className="space-y-2">
                    {result.exemptions_appliquees.map(e => (
                      <ExemptionBadge key={e.exemption_id} exemption={e} />
                    ))}
                  </div>
                </div>
              )}

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
              <span className="text-4xl mb-4">🧮</span>
              <p className="text-slate-400 text-sm">Renseignez les paramètres et cliquez sur Calculer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
