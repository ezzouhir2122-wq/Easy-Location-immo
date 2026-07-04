// src/lib/fiscal/supabase/tax-brackets.ts
import { createClient } from '@/lib/supabase/client'
import type { TaxBracketRow, TaxType } from '@/lib/fiscal/engine/types'

export async function getTaxBrackets(taxType: TaxType, year: number): Promise<TaxBracketRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_brackets')
    .select('*, tax_laws!inner(finance_year, status)')
    .eq('tax_type', taxType)
    .eq('tax_laws.finance_year', year)
    .eq('tax_laws.status', 'active')
    .order('tranche_min', { ascending: true })
  if (error) throw new Error(`tax_brackets: ${error.message}`)
  return data as TaxBracketRow[]
}

export async function getAllBrackets(): Promise<TaxBracketRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_brackets')
    .select('*')
    .order('tax_type', { ascending: true })
  if (error) throw new Error(`tax_brackets: ${error.message}`)
  return data as TaxBracketRow[]
}
