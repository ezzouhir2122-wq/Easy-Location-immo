// src/lib/fiscal/supabase/tax-laws.ts
import { createClient } from '@/lib/supabase/client'
import type { TaxLawRow } from '@/lib/fiscal/engine/types'

export async function getActiveTaxLaws(): Promise<TaxLawRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_laws')
    .select('*')
    .eq('status', 'active')
    .order('finance_year', { ascending: false })
  if (error) throw new Error(`tax_laws: ${error.message}`)
  return data as TaxLawRow[]
}

export async function getTaxLawByYear(year: number): Promise<TaxLawRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_laws')
    .select('*')
    .eq('finance_year', year)
    .eq('status', 'active')
    .single()
  if (error) return null
  return data as TaxLawRow
}

export async function getAllTaxLaws(): Promise<TaxLawRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_laws')
    .select('*')
    .order('finance_year', { ascending: false })
  if (error) throw new Error(`tax_laws: ${error.message}`)
  return data as TaxLawRow[]
}
