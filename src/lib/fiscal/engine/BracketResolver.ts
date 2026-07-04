import type { TaxBracketRow } from './types'

export class BracketResolver {
  resolve(rni: number, brackets: TaxBracketRow[]): TaxBracketRow {
    if (rni <= 0) return brackets[0]
    const sorted = [...brackets].sort((a, b) => a.tranche_min - b.tranche_min)
    const bracket = sorted.findLast(
      b => rni >= b.tranche_min && (b.tranche_max === null || rni <= b.tranche_max)
    )
    return bracket ?? sorted[sorted.length - 1]
  }

  calculateTax(rni: number, bracket: TaxBracketRow): number {
    if (rni <= 0) return 0
    return Math.max(0, rni * bracket.rate - bracket.deduction_fixe)
  }
}
