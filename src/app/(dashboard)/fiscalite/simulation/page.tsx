"use client";
import { useState, useMemo } from "react";
import { useTaxSimulation } from "@/hooks/useTaxSimulation";
import { SimulatorSlider } from "@/components/fiscal/SimulatorSlider";
import { TaxResultSummary } from "@/components/fiscal/TaxResultSummary";
import type { TaxInput } from "@/lib/fiscal/engine/types";

const YEAR = new Date().getFullYear();

export default function SimulationPage() {
  const [loyer,    setLoyer]    = useState(5000);
  const [travaux,  setTravaux]  = useState(0);
  const [interets, setInterets] = useState(0);
  const [regime,   setRegime]   = useState<"forfaitaire" | "reel">("forfaitaire");

  const input = useMemo((): TaxInput => {
    const paiements = Array.from({ length: 12 }, (_, i) => ({
      id: `p${i}`, date: `${YEAR}-${String(i + 1).padStart(2, "0")}-01`,
      montant: loyer, statut: "paye" as const
    }));
    return {
      fiscal_year: YEAR,
      bien: {
        id: "sim", type: "appartement", usage: "habitation",
        adresse: "", ville: "", valeur_acquisition: 0,
        date_acquisition: "2020-01-01", surface: 0, quote_part: 1.0
      },
      contrat: {
        loyer_mensuel: loyer, charges_mensuelles: 0, avances: 0,
        date_debut: `${YEAR}-01-01`, type_bail: "habitation", paiements
      },
      deductions: { travaux, interets_emprunts: interets, assurances: 0, frais_gestion: 0, autres: 0 },
      options: { regime, is_simulation: true }
    };
  }, [loyer, travaux, interets, regime]);

  const { result, loading } = useTaxSimulation(input);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Simulateur fiscal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Modifiez les paramètres — le résultat se met à jour automatiquement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-sm font-bold text-slate-700">Paramètres de simulation</h2>

          <SimulatorSlider
            label="Loyer mensuel" value={loyer}
            min={500} max={30000} step={500}
            onChange={setLoyer}
          />
          <SimulatorSlider
            label="Travaux annuels" value={travaux}
            min={0} max={100000} step={1000}
            onChange={setTravaux}
          />
          <SimulatorSlider
            label="Intérêts emprunts" value={interets}
            min={0} max={50000} step={500}
            onChange={setInterets}
          />

          <div>
            <p className="text-sm text-slate-600 mb-2">Régime</p>
            <div className="flex gap-2">
              {(["forfaitaire", "reel"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                    regime === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {r === "forfaitaire" ? "Forfaitaire" : "Réel"}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 space-y-1">
            <p>Revenu brut annuel : <strong className="text-slate-600">{(loyer * 12).toLocaleString("fr-FR")} DH</strong></p>
            <p>Seuil forfaitaire : <strong className="text-slate-600">120 000 DH</strong></p>
            {loyer * 12 > 120000 && regime === "forfaitaire" && (
              <p className="text-amber-600 font-medium">⚠ Revenus supérieurs au seuil forfaitaire — envisagez le régime réel</p>
            )}
          </div>
        </div>

        {/* Résultat */}
        <div>
          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex items-center justify-center">
              <div className="text-sm text-slate-400 animate-pulse">Calcul en cours...</div>
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
    </div>
  );
}
