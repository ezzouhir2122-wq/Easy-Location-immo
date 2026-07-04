import type { TaxBracketRow } from '@/lib/fiscal/engine/types'

interface Props { brackets: TaxBracketRow[]; highlightMin?: number }

export function TaxBracketTable({ brackets, highlightMin }: Props) {
  const sorted = [...brackets].sort((a, b) => a.tranche_min - b.tranche_min)

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs">
            <th className="px-4 py-3 text-left font-semibold">Tranche (DH)</th>
            <th className="px-4 py-3 text-right font-semibold">Taux</th>
            <th className="px-4 py-3 text-right font-semibold">Déduction</th>
            <th className="px-4 py-3 text-left font-semibold">Référence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sorted.map(b => {
            const active = highlightMin !== undefined && highlightMin >= b.tranche_min &&
              (b.tranche_max === null || highlightMin <= b.tranche_max)
            return (
              <tr key={b.id} className={active ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}>
                <td className="px-4 py-3 font-medium text-slate-700">
                  {b.tranche_min.toLocaleString('fr-FR')} — {b.tranche_max?.toLocaleString('fr-FR') ?? '∞'}
                  {active && <span className="ml-2 text-xs text-blue-600 font-bold">← Applicable</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold text-blue-700">
                  {(b.rate * 100).toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {b.deduction_fixe.toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{b.article_cgi}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
