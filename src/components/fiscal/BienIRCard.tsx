import type { TaxResult } from "@/lib/fiscal/engine/types"
import type { Bien } from "@/lib/supabase/biens"

type BienResult = {
  bien: Bien
  result: TaxResult | null
  loading: boolean
  error: string | null
}

interface Props {
  item: BienResult
  onDetail: () => void
}

function StatusBadge({ result, error }: { result: TaxResult | null; error: string | null }) {
  if (error) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Erreur</span>
  if (!result) return null
  if (result.revenus_encaisses === 0)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Non loué</span>
  if (result.impot_net === 0)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Exonéré</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Imposable</span>
}

const TYPE_ICONS: Record<string, string> = {
  appartement: "🏢", maison: "🏡", studio: "🛏", local_commercial: "🏪", parking: "🅿️", autre: "🏠",
}

export function BienIRCard({ item, onDetail }: Props) {
  const { bien, result, loading, error } = item
  const icon = TYPE_ICONS[bien.type] ?? "🏠"

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{bien.nom}</p>
            <p className="text-xs text-slate-400 truncate">{bien.adresse}, {bien.ville}</p>
          </div>
        </div>
        <StatusBadge result={result} error={error} />
      </div>

      {/* Chiffres */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-4 rounded animate-pulse bg-slate-100 w-3/4" />
          <div className="h-4 rounded animate-pulse bg-slate-100 w-1/2" />
        </div>
      ) : result ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Revenus encaissés</p>
            <p className="text-base font-bold text-slate-700 mt-0.5">
              {result.revenus_encaisses.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH
            </p>
          </div>
          <div className={`rounded-xl p-3 ${result.impot_net > 0 ? "bg-red-50" : "bg-green-50"}`}>
            <p className="text-xs text-slate-400">IR net à payer</p>
            <p className={`text-base font-bold mt-0.5 ${result.impot_net > 0 ? "text-red-600" : "text-green-600"}`}>
              {result.impot_net.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} DH
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Loyer mensuel base</p>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {bien.loyer_base.toLocaleString("fr-FR")} DH
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400">Taux effectif</p>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {result.revenus_encaisses > 0
                ? ((result.impot_net / result.revenus_encaisses) * 100).toFixed(1) + " %"
                : "—"}
            </p>
          </div>
        </div>
      ) : error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : null}

      {/* Action */}
      <button
        onClick={onDetail}
        disabled={!result}
        className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-600 font-medium hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 transition-colors"
      >
        Voir le détail ({result?.steps.length ?? "—"} étapes)
      </button>
    </div>
  )
}
