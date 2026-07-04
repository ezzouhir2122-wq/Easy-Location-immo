import type { RiskFlag as RiskFlagType } from '@/lib/fiscal/engine/types'

const COLORS = {
  info:     { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-800',  icon: 'ℹ' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '⚠' },
  critical: { bg: 'bg-red-50',   border: 'border-red-200',   text: 'text-red-800',   icon: '🚨' },
}

interface Props { flag: RiskFlagType }

export function RiskFlag({ flag }: Props) {
  const c = COLORS[flag.severity]
  return (
    <div className={`rounded-lg p-3 text-sm border ${c.bg} ${c.border} ${c.text}`}>
      <div className="flex items-start gap-2">
        <span>{c.icon}</span>
        <div>
          <p className="font-medium">{flag.message}</p>
          {flag.article_cgi && <p className="text-xs opacity-70 mt-0.5">{flag.article_cgi}</p>}
        </div>
      </div>
    </div>
  )
}
