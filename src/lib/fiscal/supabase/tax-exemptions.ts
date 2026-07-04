// src/lib/fiscal/supabase/tax-exemptions.ts
import { createClient } from '@/lib/supabase/client'
import type { TaxExemptionRow } from '@/lib/fiscal/engine/types'

export async function getActiveExemptions(): Promise<TaxExemptionRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_exemptions')
    .select('*')
    .eq('enabled', true)
    .order('exemption_type', { ascending: true })
  if (error) throw new Error(`tax_exemptions: ${error.message}`)
  return data as TaxExemptionRow[]
}
