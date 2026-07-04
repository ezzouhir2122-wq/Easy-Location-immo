import type { TaxStep } from '@/lib/fiscal/engine/types'

interface Props { step: TaxStep; expanded?: boolean }

export function TaxStepCard({ step, expanded = false }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step.step_number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">{step.label}</p>
            <p className="text-sm font-bold text-blue-700 ml-2">
              {step.result.toLocaleString('fr-FR')} DH
            </p>
          </div>
          {expanded && (
            <>
              <p className="text-xs text-slate-500 mt-1 font-mono">{step.formula}</p>
              {step.article_cgi && (
                <span className="inline-block mt-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5">
                  {step.article_cgi}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
