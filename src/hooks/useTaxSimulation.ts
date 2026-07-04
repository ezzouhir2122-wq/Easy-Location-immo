'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { TaxEngine } from '@/lib/fiscal/engine/TaxEngine'
import type { TaxInput, TaxResult } from '@/lib/fiscal/engine/types'

export function useTaxSimulation(input: TaxInput | null, debounceMs = 300) {
  const [result, setResult] = useState<TaxResult | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runCalculation = useCallback(async (inp: TaxInput) => {
    setLoading(true)
    try {
      const engine = new TaxEngine()
      const simInput = { ...inp, options: { ...inp.options, is_simulation: true } }
      const res = await engine.compute(simInput as TaxInput)
      setResult(res)
    } catch {
      // simulation silencieuse
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!input) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runCalculation(input), debounceMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [input, debounceMs, runCalculation])

  return { result, loading }
}
