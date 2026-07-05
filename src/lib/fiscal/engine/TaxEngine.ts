import { IRFoncierCalculator } from './IRFoncierCalculator'
import { getActiveTaxLaws } from '@/lib/fiscal/supabase/tax-laws'
import { getAllBrackets } from '@/lib/fiscal/supabase/tax-brackets'
import { getEnabledRules } from '@/lib/fiscal/supabase/tax-rules'
import { getActiveExemptions } from '@/lib/fiscal/supabase/tax-exemptions'
import { saveCalculation } from '@/lib/fiscal/supabase/tax-calculations'
import type { TaxInput, TaxResult, FiscalContext, TaxBracketRow, TaxLawRow } from './types'

// Barème IR foncier 2026 — DGI Maroc, Art. 73-II-B CGI, LF 2026
// Utilisé en fallback si la DB Supabase ne retourne pas de données
const STATIC_LAW_2026: TaxLawRow = {
  id: 'static-2026', finance_year: 2026, law_number: 'n°70-25',
  title: 'Loi de Finances 2026', publication_date: '2025-12-31',
  effective_date: '2026-01-01', expiration_date: null,
  official_ref: 'Bulletin Officiel n°7350 du 31 décembre 2025',
  source_url: null, status: 'active', notes: null, created_at: ''
}

const STATIC_BRACKETS_2026: TaxBracketRow[] = [
  { id: 's1', law_id: 'static-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null, tranche_min: 0,      tranche_max: 40000,  rate: 0.00, deduction_fixe: 0,     abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
  { id: 's2', law_id: 'static-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null, tranche_min: 40001,   tranche_max: 60000,  rate: 0.10, deduction_fixe: 4000,  abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
  { id: 's3', law_id: 'static-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null, tranche_min: 60001,   tranche_max: 80000,  rate: 0.20, deduction_fixe: 10000, abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
  { id: 's4', law_id: 'static-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null, tranche_min: 80001,   tranche_max: 100000, rate: 0.30, deduction_fixe: 18000, abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
  { id: 's5', law_id: 'static-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null, tranche_min: 100001,  tranche_max: 180000, rate: 0.34, deduction_fixe: 22000, abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
  { id: 's6', law_id: 'static-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null, tranche_min: 180001,  tranche_max: null,   rate: 0.37, deduction_fixe: 27400, abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
  { id: 's7', law_id: 'static-2026', tax_type: 'ir_foncier_forfaitaire', property_type: null, usage_type: null, tranche_min: 0, tranche_max: 120000, rate: 0.15, deduction_fixe: 0, abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: '' },
]

export class TaxEngine {
  private irCalculator = new IRFoncierCalculator()

  private async loadContext(): Promise<FiscalContext> {
    const [laws, brackets, rules, exemptions] = await Promise.all([
      getActiveTaxLaws().catch(() => [] as TaxLawRow[]),
      getAllBrackets().catch(() => [] as TaxBracketRow[]),
      getEnabledRules().catch(() => []),
      getActiveExemptions().catch(() => []),
    ])
    return {
      laws:      laws.length      > 0 ? laws      : [STATIC_LAW_2026],
      brackets:  brackets.length  > 0 ? brackets  : STATIC_BRACKETS_2026,
      rules,
      exemptions,
    }
  }

  async compute(input: TaxInput): Promise<TaxResult> {
    const ctx = await this.loadContext()
    return this.irCalculator.calculate(input, ctx)
  }

  async computeAndSave(
    input: TaxInput,
    meta: { bien_id: string | null; contrat_id: string | null }
  ): Promise<TaxResult> {
    const ctx = await this.loadContext()
    const result = await this.irCalculator.calculate(input, ctx)
    const id = await saveCalculation({
      bien_id: meta.bien_id,
      contrat_id: meta.contrat_id,
      fiscal_year: input.fiscal_year,
      tax_type: result.tax_type,
      input,
      result,
      context: ctx,
      is_simulation: input.options?.is_simulation ?? false,
    })
    return { ...result, calculation_id: id }
  }
}
