"use client"
import { useState, useEffect } from "react"
import { getBiens, type Bien } from "@/lib/supabase/biens"
import { getLoyersByYear, type Loyer } from "@/lib/supabase/loyers"
import { TaxEngine } from "@/lib/fiscal/engine/TaxEngine"
import { BienIRCard } from "@/components/fiscal/BienIRCard"
import { TaxStepCard } from "@/components/fiscal/TaxStepCard"
import { RiskFlag } from "@/components/fiscal/RiskFlag"
import type { TaxInput, TaxResult, Regime, BailType, PropertyType, Paiement } from "@/lib/fiscal/engine/types"

const YEARS = [2026, 2025, 2024]

export type BienResult = {
  bien: Bien
  result: TaxResult | null
  loading: boolean
  error: string | null
}

function mapPropertyType(type: Bien["type"]): PropertyType {
  const map: Record<Bien["type"], PropertyType> = {
    appartement: "appartement",
    maison: "maison",
    studio: "studio",
    local_commercial: "local_commercial",
    parking: "parking",
    autre: "autre",
  }
  return map[type] ?? "autre"
}

function mapBailType(type: Bien["type"]): BailType {
  return type === "local_commercial" ? "commercial" : "habitation"
}

function buildTaxInput(bien: Bien, allLoyers: Loyer[], year: number, regime: Regime): TaxInput {
  const paiements: Paiement[] = allLoyers
    .filter((l) => l.bien_id === bien.id && l.type === "loyer")
    .map((l) => ({
      id: l.id,
      date: l.date_paiement ?? l.date_echeance,
      montant: l.montant,
      statut:
        l.statut === "paye" ? ("paye" as const)
        : l.statut === "partiel" ? ("partiel" as const)
        : ("impaye" as const),
    }))

  return {
    fiscal_year: year,
    bien: {
      id: bien.id,
      type: mapPropertyType(bien.type),
      usage: bien.type === "local_commercial" ? "commercial" : "habitation",
      adresse: bien.adresse,
      ville: bien.ville,
      valeur_acquisition: 0,
      date_acquisition: bien.created_at.split("T")[0],
      surface: bien.surface ?? 0,
      quote_part: 1.0,
    },
    contrat: {
      loyer_mensuel: bien.loyer_base,
      charges_mensuelles: bien.charges ?? 0,
      avances: 0,
      date_debut: `${year}-01-01`,
      type_bail: mapBailType(bien.type),
      paiements,
    },
    options: { regime, is_simulation: false },
  }
}

export default function DeclarationPage() {
  const [year, setYear] = useState(2026)
  const [regime, setRegime] = useState<Regime>("forfaitaire")
  const [items, setItems] = useState<BienResult[]>([])
  const [loadingAll, setLoadingAll] = useState(true)
  const [selected, setSelected] = useState<BienResult | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoadingAll(true)
      setSelected(null)
      try {
        const [biens, loyers] = await Promise.all([getBiens(), getLoyersByYear(year)])
        if (cancelled) return
        const engine = new TaxEngine()
        const results = await Promise.all(
          biens.map(async (bien): Promise<BienResult> => {
            try {
              const input = buildTaxInput(bien, loyers, year, regime)
              const result = await engine.compute(input)
              return { bien, result, loading: false, error: null }
            } catch (e: unknown) {
              return { bien, result: null, loading: false, error: e instanceof Error ? e.message : "Erreur inconnue" }
            }
          })
        )
        if (!cancelled) setItems(results)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoadingAll(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [year, regime])

  const totalEncaisses = items.reduce((s, it) => s + (it.result?.revenus_encaisses ?? 0), 0)
  const totalIR = items.reduce((s, it) => s + (it.result?.impot_net ?? 0), 0)
  const nbImposables = items.filter((it) => (it.result?.impot_net ?? 0) > 0).length

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Déclaration IR Foncier — Perception
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          État fiscal par bien — à déposer auprès du bureau de la perception
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-6 mb-6">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Année fiscale</label>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  year === y
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Régime</label>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {([["forfaitaire", "Forfaitaire"], ["reel", "Réel"]] as [Regime, string][]).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setRegime(val)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  regime === val
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bandeau récap */}
      {!loadingAll && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Biens déclarés", value: items.length.toString(), suffix: "", color: "text-slate-800" },
            { label: "Revenus encaissés", value: totalEncaisses.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), suffix: " DH", color: "text-slate-800" },
            { label: "Biens imposables", value: nbImposables.toString(), suffix: "", color: nbImposables > 0 ? "text-amber-600" : "text-green-600" },
            { label: "IR total dû", value: totalIR.toLocaleString("fr-FR", { minimumFractionDigits: 2 }), suffix: " DH", color: totalIR > 0 ? "text-red-600" : "text-green-600" },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color}`}>
                {value}{suffix}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Grille biens */}
      {loadingAll ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <span className="text-4xl mb-4">🏠</span>
          <p className="text-slate-500 font-medium">Aucun bien enregistré</p>
          <p className="text-slate-400 text-sm mt-1">Ajoutez des biens dans la section Biens pour voir leur état fiscal</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <BienIRCard key={item.bien.id} item={item} onDetail={() => setSelected(item)} />
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div className="relative ml-auto w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header modal */}
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800">{selected.bien.nom}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selected.bien.adresse}, {selected.bien.ville} — Exercice {year}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selected.result ? (
                <>
                  {/* Résumé chiffres */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Revenus encaissés", value: selected.result.revenus_encaisses, cls: "text-emerald-600" },
                      { label: "Abattement", value: selected.result.abattement, cls: "text-indigo-600" },
                      { label: "Revenu Net Imposable", value: selected.result.revenu_net_imposable, cls: "text-blue-600" },
                      { label: "IR net à payer", value: selected.result.impot_net, cls: selected.result.impot_net > 0 ? "text-red-600" : "text-emerald-600" },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className={`text-sm font-bold mt-0.5 ${cls}`}>
                          {value.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 14 étapes */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Détail des {selected.result.steps.length} étapes
                    </h3>
                    <div className="space-y-2">
                      {selected.result.steps.map((s) => (
                        <TaxStepCard key={s.step_number} step={s} expanded />
                      ))}
                    </div>
                  </div>

                  {/* Alertes */}
                  {selected.result.risques_fiscaux.length > 0 && (
                    <div className="space-y-2">
                      {selected.result.risques_fiscaux.map((r) => (
                        <RiskFlag key={r.code} flag={r} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
                  {selected.error ?? "Calcul indisponible"}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-6 py-3 flex-shrink-0">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Imprimer pour la perception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
