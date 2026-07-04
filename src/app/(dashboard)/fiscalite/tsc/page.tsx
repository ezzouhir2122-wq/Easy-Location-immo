"use client";
import { useState } from "react";
import { TSCCalculator } from "@/lib/fiscal/engine/TSCCalculator";
import { TaxStepCard } from "@/components/fiscal/TaxStepCard";
import { RiskFlag } from "@/components/fiscal/RiskFlag";
import type { TSCInput, TSCResult, ZoneType } from "@/lib/fiscal/engine/types";

const calc = new TSCCalculator();
const CURRENT_YEAR = new Date().getFullYear();

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ZONES: { id: ZoneType; label: string; taux: string; desc: string }[] = [
  { id: "urbain",    label: "Zone urbaine",    taux: "10,5%", desc: "Commune urbaine (municipalité)" },
  { id: "suburbain", label: "Zone suburbaine", taux: "6,5%",  desc: "Périphérie — zone mixte" },
  { id: "rural",     label: "Zone rurale",     taux: "6,5%",  desc: "Hors périmètre communal" },
];

export default function TSCPage() {
  const [form, setForm] = useState({
    fiscal_year: CURRENT_YEAR,
    vla_annuelle: 24_000,
    zone: "urbain" as ZoneType,
  });
  const [result, setResult] = useState<TSCResult | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setResult(null);
  }

  function handleCalculer() {
    const input: TSCInput = { ...form, is_simulation: true };
    setResult(calc.calculate(input));
  }

  const tsc_preview = Math.max(form.vla_annuelle * (form.zone === "urbain" ? 0.105 : 0.065), 100);
  const loyerMensuelEquiv = Math.round(form.vla_annuelle / 12);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Taxe de Services Communaux (TSC)
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          10,5% zone urbaine · 6,5% zone suburbaine/rurale · Minimum 100 DH — CGI Art. 32, LF 2026
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
                  ≈ {loyerMensuelEquiv.toLocaleString("fr-FR")} DH/mois
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
                <label className="block text-xs text-slate-500 mb-2">Zone géographique</label>
                <div className="space-y-2">
                  {ZONES.map(z => (
                    <button
                      key={z.id}
                      onClick={() => setField("zone", z.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                        form.zone === z.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium">{z.label}</p>
                        <p className={`text-[11px] ${form.zone === z.id ? "text-blue-200" : "text-slate-400"}`}>
                          {z.desc}
                        </p>
                      </div>
                      <span className="text-sm font-bold">{z.taux}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculer}
              className="w-full mt-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Calculer la TSC
            </button>

            {/* Aperçu */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Estimation TSC</span>
              <span className="font-bold text-slate-700">{fmt(tsc_preview)} DH</span>
            </div>
          </div>

          {/* Règle légale */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-500 font-semibold mb-2">Art. 32 CGI — Règle essentielle</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              La TSC est due par toute personne physique ou morale qui dispose, au 1er janvier de l&apos;année
              d&apos;imposition, de locaux à usage d&apos;habitation ou professionnel.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Minimum légal : <strong>100 DH</strong> (Art. 32-II CGI)
            </p>
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Résumé */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Résumé TSC</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "VLA annuelle", value: result.vla, color: "#2563EB", suffix: "DH" },
                    { label: `Taux (${form.zone})`, value: result.taux_zone * 100, color: "#7C3AED", suffix: "%" },
                    { label: "TSC à payer", value: result.tsc_net, color: result.tsc_net <= 100 ? "#F59E0B" : "#EF4444", suffix: "DH" },
                  ].map(({ label, value, color, suffix }) => (
                    <div key={label} className="rounded-xl p-4 border border-slate-100 text-center">
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <p className="text-lg font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                        {suffix === "%" ? value.toFixed(1) : fmt(value)} {suffix}
                      </p>
                    </div>
                  ))}
                </div>

                {result.tsc_net === 100 && result.tsc_brut < 100 && (
                  <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    Montant minimum légal appliqué (TSC calculé = {fmt(result.tsc_brut)} DH &lt; 100 DH)
                  </p>
                )}
              </div>

              {/* Étapes */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-700">Détail du calcul (3 étapes)</h3>
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
              <span className="text-4xl mb-4">🏛</span>
              <p className="text-slate-400 text-sm">
                Renseignez la VLA et la zone, puis cliquez sur Calculer
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
