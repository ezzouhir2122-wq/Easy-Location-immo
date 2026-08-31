"use client"
import { useState, useEffect } from "react"
import { getBiens, type Bien } from "@/lib/supabase/biens"
import { getLoyersByYear, type Loyer } from "@/lib/supabase/loyers"
import { TaxEngine } from "@/lib/fiscal/engine/TaxEngine"
import { BienIRCard } from "@/components/fiscal/BienIRCard"
import { TaxStepCard } from "@/components/fiscal/TaxStepCard"
import { RiskFlag } from "@/components/fiscal/RiskFlag"
import type { TaxInput, TaxResult, Regime, BailType, PropertyType, Paiement } from "@/lib/fiscal/engine/types"

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

function buildTaxInput(
  bien: Bien, allLoyers: Loyer[], year: number, regime: Regime, nbPersonnes: number
): TaxInput {
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

  const isCommercial = bien.type === "local_commercial"

  return {
    fiscal_year: year,
    bien: {
      id: bien.id,
      type: mapPropertyType(bien.type),
      usage: isCommercial ? "commercial" : "habitation",
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
      locataire_personne_morale: isCommercial, // locataire PM → retenue 10%
    },
    options: { regime, is_simulation: false, nb_personnes_charge: nbPersonnes },
  }
}

export default function DeclarationPage() {
  const [year, setYear] = useState(2026)
  const [yearInput, setYearInput] = useState("2026")
  const [regime, setRegime] = useState<Regime>("forfaitaire")
  const [nbPersonnes, setNbPersonnes] = useState(0)
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
              const input = buildTaxInput(bien, loyers, year, regime, nbPersonnes)
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
  }, [year, regime, nbPersonnes])

  const totalEncaisses = items.reduce((s, it) => s + (it.result?.revenus_encaisses ?? 0), 0)
  const totalIR = items.reduce((s, it) => s + (it.result?.impot_net ?? 0), 0)
  const nbImposables = items.filter((it) => (it.result?.impot_net ?? 0) > 0).length

  function exportPDF() {
    const dh = (v: number) => v.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " DH"
    const rows = items.map((it) => {
      const r = it.result
      if (!r) return `<tr><td>${it.bien.nom}</td><td colspan="6" style="color:#ef4444">Erreur de calcul</td></tr>`
      const statut = r.impot_net <= 0 ? `<span style="color:#10b981;font-weight:600">Exonéré</span>`
        : `<span style="color:#ef4444;font-weight:600">Imposable</span>`
      return `<tr>
        <td>${it.bien.nom}<br><small style="color:#94a3b8">${it.bien.adresse}, ${it.bien.ville}</small></td>
        <td>${dh(r.revenus_encaisses)}</td>
        <td>${dh(r.tsc_deduit)}</td>
        <td>${dh(r.abattement)}</td>
        <td>${dh(r.revenu_net_imposable)}</td>
        <td>${dh(r.impot_net)}</td>
        <td>${statut}</td>
      </tr>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Déclaration IR Foncier ${year}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { color: #64748b; font-size: 11px; margin-bottom: 24px; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .kpi-label { font-size: 10px; color: #94a3b8; margin-bottom: 4px; }
    .kpi-value { font-size: 16px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f8fafc; text-align: left; padding: 8px 10px; font-size: 10px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .footer { color: #94a3b8; font-size: 10px; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Déclaration IR Foncier — Exercice ${year}</h1>
  <p class="subtitle">
    Régime : ${regime === "forfaitaire" ? "Forfaitaire (abattement 40%)" : "Réel (charges déductibles)"}
    &nbsp;·&nbsp; Personnes à charge : ${nbPersonnes}
    &nbsp;·&nbsp; Généré le ${new Date().toLocaleDateString("fr-FR")}
  </p>

  <div class="kpis">
    <div class="kpi"><div class="kpi-label">Biens déclarés</div><div class="kpi-value">${items.length}</div></div>
    <div class="kpi"><div class="kpi-label">Revenus encaissés</div><div class="kpi-value">${dh(totalEncaisses)}</div></div>
    <div class="kpi"><div class="kpi-label">Biens imposables</div><div class="kpi-value" style="color:${nbImposables > 0 ? "#f59e0b" : "#10b981"}">${nbImposables}</div></div>
    <div class="kpi"><div class="kpi-label">IR total dû</div><div class="kpi-value" style="color:${totalIR > 0 ? "#ef4444" : "#10b981"}">${dh(totalIR)}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Bien</th>
        <th>Revenus encaissés</th>
        <th>TSC déduit</th>
        <th>Abattement</th>
        <th>RNI</th>
        <th>IR net</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    Document préparatoire basé sur les données enregistrées — à vérifier avec votre conseiller fiscal avant dépôt.
    &nbsp;·&nbsp; Easy Location Immo
  </div>
</body>
</html>`

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Déclaration IR Foncier — Perception
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            État fiscal par bien — à déposer auprès du bureau de la perception
          </p>
        </div>
        {!loadingAll && items.length > 0 && (
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            ⬇ Télécharger PDF
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-6 mb-6">
        {/* Année fiscale : combobox saisie + liste */}
        <div>
          <label htmlFor="year-input" className="block text-xs text-slate-500 mb-1.5">Année fiscale</label>
          <div className="relative">
            <input
              id="year-input"
              list="fiscal-years-list"
              value={yearInput}
              onChange={(e) => {
                setYearInput(e.target.value)
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 2000 && v <= 2099) setYear(v)
              }}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 2000 && v <= 2099) {
                  setYear(v)
                  setYearInput(String(v))
                } else {
                  setYearInput(String(year))
                }
              }}
              placeholder="ex. 2026"
              className="w-36 pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <datalist id="fiscal-years-list">
              {Array.from({ length: 10 }, (_, i) => 2026 - i).map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Régime */}
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

        {/* Personnes à charge (conjoint + enfants) */}
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">
            Personnes à charge
            <span className="ml-1 text-slate-400">(conjoint + enfants)</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNbPersonnes(Math.max(0, nbPersonnes - 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center"
            >−</button>
            <span className="w-10 text-center text-sm font-bold text-slate-800">{nbPersonnes}</span>
            <button
              onClick={() => setNbPersonnes(Math.min(6, nbPersonnes + 1))}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center"
            >+</button>
            {nbPersonnes > 0 && (
              <span className="text-xs text-indigo-600 font-medium">
                − {(nbPersonnes * 500).toLocaleString("fr-FR")} DH
              </span>
            )}
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
                      { label: "TSC déduit (10.5%)", value: selected.result.tsc_deduit, cls: "text-slate-500" },
                      { label: "Charges syndic", value: selected.result.charges_syndic, cls: "text-slate-500" },
                      { label: "Abattement (40%)", value: selected.result.abattement, cls: "text-indigo-600" },
                      { label: "Revenu Net Imposable", value: selected.result.revenu_net_imposable, cls: "text-blue-600" },
                      { label: "Impôt brut", value: selected.result.impot_brut, cls: "text-orange-600" },
                      ...(selected.result.reduction_famille > 0 ? [{ label: `Réd. famille (${nbPersonnes} pers.)`, value: selected.result.reduction_famille, cls: "text-indigo-500" }] : []),
                      ...(selected.result.retenue_source > 0 ? [{ label: "Retenue source (10%)", value: selected.result.retenue_source, cls: "text-slate-500" }] : []),
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

                  {/* Étapes détaillées */}
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
