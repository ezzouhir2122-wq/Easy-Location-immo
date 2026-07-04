import type { AppliedExemption } from '@/lib/fiscal/engine/types'

interface Props { exemption: AppliedExemption }

export function ExemptionBadge({ exemption }: Props) {
  return (
    <div className={`rounded-lg p-3 text-sm border ${
      exemption.accepted
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center gap-2">
        <span>{exemption.accepted ? '✓' : '✗'}</span>
        <span className="font-medium">{exemption.label}</span>
        {exemption.article_cgi && (
          <span className="text-xs opacity-70">{exemption.article_cgi}</span>
        )}
      </div>
      {!exemption.accepted && exemption.rejection_reason && (
        <p className="mt-1 text-xs opacity-80">{exemption.rejection_reason}</p>
      )}
    </div>
  )
}
