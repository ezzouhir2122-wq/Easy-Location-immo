import type { TaxResult } from '@/lib/fiscal/engine/types'

interface Props { result: TaxResult }

export function TaxResultSummary({ result }: Props) {
  const items = [
    { label: 'Revenu brut', value: result.revenu_brut, color: '#64748B' },
    { label: 'Revenus encaissés', value: result.revenus_encaisses, color: '#10B981' },
    { label: 'Abattement', value: result.abattement, color: '#6366F1' },
    { label: 'Revenu Net Imposable', value: result.revenu_net_imposable, color: '#2563EB' },
    { label: 'Impôt net à payer', value: result.impot_net, color: result.impot_net === 0 ? '#10B981' : '#EF4444' },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700">
          Résultat IR Foncier {result.fiscal_year} — {result.regime === 'forfaitaire' ? 'Régime forfaitaire' : 'Régime réel'}
        </h3>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm font-bold" style={{ color }}>
              {value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
            </span>
          </div>
        ))}
      </div>
      {result.impot_net === 0 && (
        <div className="px-5 py-3 bg-green-50 text-xs text-green-700 font-medium">
          Exonération totale appliquée
        </div>
      )}
    </div>
  )
}
