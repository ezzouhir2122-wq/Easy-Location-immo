import { IRFoncierCalculator } from './IRFoncierCalculator'
import { getActiveTaxLaws } from '@/lib/fiscal/supabase/tax-laws'
import { getAllBrackets } from '@/lib/fiscal/supabase/tax-brackets'
import { getEnabledRules } from '@/lib/fiscal/supabase/tax-rules'
import { getActiveExemptions } from '@/lib/fiscal/supabase/tax-exemptions'
import { saveCalculation } from '@/lib/fiscal/supabase/tax-calculations'
import type { TaxInput, TaxResult, FiscalContext } from './types'

export class TaxEngine {
  private irCalculator = new IRFoncierCalculator()

  private async loadContext(): Promise<FiscalContext> {
    const [laws, brackets, rules, exemptions] = await Promise.all([
      getActiveTaxLaws(),
      getAllBrackets(),
      getEnabledRules(),
      getActiveExemptions(),
    ])
    return { laws, brackets, rules, exemptions }
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
