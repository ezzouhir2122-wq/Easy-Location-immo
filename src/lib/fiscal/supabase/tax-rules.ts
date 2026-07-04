// src/lib/fiscal/supabase/tax-rules.ts
import { createClient } from '@/lib/supabase/client'
import type { TaxRuleRow } from '@/lib/fiscal/engine/types'

export async function getEnabledRules(): Promise<TaxRuleRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_rules')
    .select('*')
    .eq('enabled', true)
    .order('priority', { ascending: true })
  if (error) throw new Error(`tax_rules: ${error.message}`)
  return data as TaxRuleRow[]
}

export async function getRuleByKey(key: string): Promise<TaxRuleRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_rules')
    .select('*')
    .eq('rule_key', key)
    .eq('enabled', true)
    .single()
  if (error) return null
  return data as TaxRuleRow
}

export async function getAllRules(): Promise<TaxRuleRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tax_rules')
    .select('*')
    .order('priority', { ascending: true })
  if (error) throw new Error(`tax_rules: ${error.message}`)
  return data as TaxRuleRow[]
}
