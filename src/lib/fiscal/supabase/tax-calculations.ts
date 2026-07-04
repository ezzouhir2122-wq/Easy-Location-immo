// src/lib/fiscal/supabase/tax-calculations.ts
import { createClient } from '@/lib/supabase/client'
import type { TaxResult, TaxInput, FiscalContext } from '@/lib/fiscal/engine/types'

export interface SaveCalculationPayload {
  bien_id: string | null
  contrat_id: string | null
  fiscal_year: number
  tax_type: string
  input: TaxInput
  result: TaxResult
  context: FiscalContext
  is_simulation: boolean
}

export async function saveCalculation(payload: SaveCalculationPayload): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('tax_calculations')
    .insert({
      owner_id:       user.id,
      bien_id:        payload.bien_id,
      contrat_id:     payload.contrat_id,
      fiscal_year:    payload.fiscal_year,
      tax_type:       payload.tax_type,
      input_snapshot: payload.input,
      steps_detail:   payload.result.steps,
      rules_applied:  payload.result.rules_applied,
      laws_snapshot:  payload.result.laws_referenced,
      result:         payload.result,
      is_simulation:  payload.is_simulation,
    })
    .select('id')
    .single()

  if (error) throw new Error(`save_calculation: ${error.message}`)
  return data.id
}

export async function getCalculationHistory(fiscalYear?: number) {
  const supabase = createClient()
  let query = supabase
    .from('tax_calculations')
    .select('id, fiscal_year, tax_type, result, is_simulation, created_at, biens(nom)')
    .order('created_at', { ascending: false })

  if (fiscalYear) query = query.eq('fiscal_year', fiscalYear)

  const { data, error } = await query
  if (error) throw new Error(`calculation_history: ${error.message}`)
  return data
}

export async function getCalculationById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_calculations')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(`get_calculation: ${error.message}`)
  return data
}
