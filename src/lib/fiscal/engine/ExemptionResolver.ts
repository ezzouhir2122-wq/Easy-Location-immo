import { RuleEvaluator } from './RuleEvaluator'
import type { TaxExemptionRow, TaxInput, AppliedExemption } from './types'

export class ExemptionResolver {
  private evaluator = new RuleEvaluator()

  resolve(
    exemptions: TaxExemptionRow[],
    input: TaxInput,
    ctx: Record<string, number | string | boolean>
  ): AppliedExemption[] {
    return exemptions.map(ex => {
      const eligiblePropertyType =
        ex.property_types.length === 0 || ex.property_types.includes(input.bien.type)

      if (!eligiblePropertyType) {
        return {
          exemption_id: ex.id,
          label: ex.label,
          type: ex.exemption_type,
          rate: ex.rate,
          article_cgi: ex.article_cgi,
          accepted: false,
          rejection_reason: `Type de bien "${input.bien.type}" non éligible à cette exonération`,
        }
      }

      const conditionsMet = this.evaluator.evaluateConditions(ex.conditions, ctx)

      if (!conditionsMet) {
        const condSummary = ex.conditions
          .map(c => ('field' in c ? `${c.field} ${c.op} ${JSON.stringify('value' in c ? c.value : '')}` : ''))
          .join(', ')
        return {
          exemption_id: ex.id,
          label: ex.label,
          type: ex.exemption_type,
          rate: ex.rate,
          article_cgi: ex.article_cgi,
          accepted: false,
          rejection_reason: `Conditions non remplies : ${condSummary}`,
        }
      }

      return {
        exemption_id: ex.id,
        label: ex.label,
        type: ex.exemption_type,
        rate: ex.rate,
        article_cgi: ex.article_cgi,
        accepted: true,
      }
    })
  }

  hasFullExemption(exemptions: AppliedExemption[]): boolean {
    return exemptions.some(e => e.accepted && e.rate >= 1.0)
  }
}
