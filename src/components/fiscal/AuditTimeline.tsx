'use client'
import { useState } from 'react'
import { TaxStepCard } from './TaxStepCard'
import type { TaxStep } from '@/lib/fiscal/engine/types'

interface Props { steps: TaxStep[] }

export function AuditTimeline({ steps }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {steps.map(step => (
        <button
          key={step.step_number}
          className="w-full text-left"
          onClick={() => setExpanded(expanded === step.step_number ? null : step.step_number)}
        >
          <TaxStepCard step={step} expanded={expanded === step.step_number} />
        </button>
      ))}
    </div>
  )
}
