'use client'
import { useState, useCallback } from 'react'
import { TaxEngine } from '@/lib/fiscal/engine/TaxEngine'
import type { TaxInput, TaxResult } from '@/lib/fiscal/engine/types'

export function useTaxCalculation() {
  const [result, setResult] = useState<TaxResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (input: TaxInput, save = false) => {
    setLoading(true)
    setError(null)
    try {
      const engine = new TaxEngine()
      const res = save
        ? await engine.computeAndSave(input, { bien_id: input.bien.id, contrat_id: null })
        : await engine.compute(input)
      setResult(res)
      return res
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur de calcul'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, loading, error, calculate, reset }
}
