"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useTaxCalculation } from "@/hooks/useTaxCalculation";
import { useTaxSimulation } from "@/hooks/useTaxSimulation";
import { SimulatorSlider } from "@/components/fiscal/SimulatorSlider";
import { TaxStepCard } from "@/components/fiscal/TaxStepCard";
import { TaxResultSummary } from "@/components/fiscal/TaxResultSummary";
import { ExemptionBadge } from "@/components/fiscal/ExemptionBadge";
import { RiskFlag } from "@/components/fiscal/RiskFlag";
import type { TaxInput, Regime } from "@/lib/fiscal/engine/types";

const CURRENT_YEAR = new Date().getFullYear();

/* ─── Mode rapide (sliders) ─── */
function ModeRapide() {
  const [loyer,    setLoyer]    = useState(5000);
  const [travaux,  setTravaux]  = useState(0);
  const [interets, setInterets] = useState(0);
  const [regime,   setRegime]   = useState<"forfaitaire" | "reel">("forfaitaire");

  const input = useMemo((): TaxInput => {
    const paiements = Array.from({ length: 12 }, (_, i) => ({
      id: `p${i}`, date: `${CURRENT_YEAR}-${String(i + 1).padStart(2, "0")}-01`,
      montant: loyer, statut: "paye" as const,
    }));
    return {
      fiscal_year: CURRENT_YEAR,
      bien: {
        id: "sim", type: "appartement", usage: "habitation",
        adresse: "", ville: "", valeur_acquisition: 0,
        date_acquisition: "2020-01-01", surface: 0, quote_part: 1.0,
      },
      contrat: {
        loyer_mensuel: loyer, charges_mensuelles: 0, avances: 0,
        date_debut: `${CURRENT_YEAR}-01-01`, type_bail: "habitation", paiements,
      },
      deductions: { travaux, interets_emprunts: interets, assurances: 0, frais_gestion: 0, autres: 0 },
      options: { regime, is_simulation: true },
    };
  }, [loyer, travaux, interets, regime]);

  const { result, loading } = useTaxSimulation(input);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sliders */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
        <h2 className="text-sm font-bold text-slate-700">Paramètres</h2>

        <SimulatorSlider label="Loyer mensuel" value={loyer} min={500} max={30000} step={500} onChange={setLoyer} />
        <SimulatorSlider label="Travaux annuels" value={travaux} min={0} max={100000} step={1000} onChange={setTravaux} />
        <SimulatorSlider label="Intérêts emprunts" value={interets} min={0} max={50000} step={500} onChange={setInterets} />

        <div>
          <p className="text-sm text-slate-600 mb-2">Régime</p>
          <div className="flex gap-2">
            {(["forfaitaire", "reel"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRegime(r)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                  regime === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                {r === "forfaitaire" ? "Forfaitaire" : "Réel"}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 space-y-1">
          <p>Revenu brut annuel : <strong className="text-slate-600">{(loyer * 12).toLocaleString("fr-FR")} DH</strong></p>
          {loyer * 12 > 120000 && regime === "forfaitaire" && (
            <p className="text-amber-600 font-medium">⚠ Revenus &gt; 120 000 DH — envisagez le régime réel</p>
          )}
        </div>
      </div>

      {/* Résultat */}
      <div>
        {loading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex items-center justify-center">
            <div className="text-sm text-slate-400 animate-pulse">Calcul en cours…</div>
          </div>
        ) : result ? (
          <TaxResultSummary result={result} />
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3">⚡</span>
            <p className="text-slate-400 text-sm">Le résultat apparaîtra ici</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mode détaillé (inputs précis) ─── */
function buildInput(form: {
  loyerMensuel: number; annee: number; regime: Regime;
  travaux: number; interets: number; assurances: number;
}): TaxInput {
  const paiements = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`, date: `${form.annee}-${String(i + 1).padStart(2, "0")}-01`,
    montant: form.loyerMensuel, statut: "paye" as const,
  }));
  return {
    fiscal_year: form.annee,
    bien: {
      id: "manual", type: "appartement", usage: "habitation",
      adresse: "", ville: "", valeur_acquisition: 0,
      date_acquisition: "2020-01-01", surface: 0, quote_part: 1.0,
    },
    contrat: {
      loyer_mensuel: form.loyerMensuel, charges_mensuelles: 0,
      avances: 0, date_debut: `${form.annee}-01-01`,
      type_bail: "habitation", paiements,
    },
    deductions: { travaux: form.travaux, interets_emprunts: form.interets, assurances: form.assurances, frais_gestion: 0, autres: 0 },
    options: { regime: form.regime, is_simulation: false },
  };
}

function ModeDetaille() {
  const [form, setForm] = useState({
    loyerMensuel: 5000, annee: CURRENT_YEAR,
    regime: "forfaitaire" as Regime,
    travaux: 0, interets: 0, assurances: 0,
  });
  const [expandAll, setExpandAll] = useState(false);
  const { result, loading, error, calculate } = useTaxCalculation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
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

          <div className="flex items-center gap-2 mt-5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${loading ? "bg-amber-400 animate-pulse" : result ? "bg-green-500" : "bg-slate-300"}`} />
            <span className="text-xs text-slate-500">
              {loading ? "Calcul en cours…" : result ? "Résultat mis à jour" : "Renseignez les paramètres"}
            </span>
          </div>
          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
      </div>

      {/* Résultats */}
      <div className="lg:col-span-3 space-y-4">
        {result ? (
          <>
            <TaxResultSummary result={result} />

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700">Détail des étapes</h3>
                <button onClick={() => setExpandAll(e => !e)} className="text-xs text-blue-600 hover:underline">
                  {expandAll ? "Réduire" : "Tout afficher"}
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {result.steps.map(s => <TaxStepCard key={s.step_number} step={s} expanded={expandAll} />)}
              </div>
            </div>

            {result.exemptions_appliquees.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Exonérations vérifiées</h3>
                <div className="space-y-2">
                  {result.exemptions_appliquees.map(e => <ExemptionBadge key={e.exemption_id} exemption={e} />)}
                </div>
              </div>
            )}

            {result.risques_fiscaux.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-3">Alertes fiscales</h3>
                <div className="space-y-2">
                  {result.risques_fiscaux.map(r => <RiskFlag key={r.code} flag={r} />)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-4">🧮</span>
            <p className="text-slate-400 text-sm">Renseignez les paramètres pour voir le calcul</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page principale ─── */
export default function CalculateurPage() {
  const [mode, setMode] = useState<"rapide" | "detaille">("rapide");

  return (
    <div className="p-8 max-w-6xl">
      {/* En-tête + toggle */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Calculateur IR Foncier
          </h1>
          <p className="text-slate-500 text-sm mt-1">Simulation hypothétique — données indépendantes de vos biens</p>
        </div>

        {/* Toggle mode */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setMode("rapide")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === "rapide" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ⚡ Rapide
          </button>
          <button
            onClick={() => setMode("detaille")}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === "detaille" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🧮 Détaillé
          </button>
        </div>
      </div>

      {mode === "rapide" ? <ModeRapide /> : <ModeDetaille />}
    </div>
  );
}
