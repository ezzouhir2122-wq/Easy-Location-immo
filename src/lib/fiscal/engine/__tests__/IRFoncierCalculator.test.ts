import { describe, it, expect, beforeEach } from 'vitest'
import { IRFoncierCalculator } from '../IRFoncierCalculator'
import type { TaxInput, FiscalContext, TaxBracketRow, TaxLawRow } from '../types'

const LAW_2026: TaxLawRow = {
  id: 'law-2026', finance_year: 2026, law_number: 'n°70-25',
  title: 'LF 2026', publication_date: '2025-12-31', effective_date: '2026-01-01',
  expiration_date: null, official_ref: 'B.O. n°7350', source_url: null,
  status: 'active', notes: null, created_at: ''
}

const BRACKETS: TaxBracketRow[] = [
  { id: 'b0', law_id: 'law-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 0, tranche_max: 30000, rate: 0, deduction_fixe: 0, abattement_rate: 0,
    effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B',
    loi_finances: 'LF 2026', created_at: '' },
  { id: 'b1', law_id: 'law-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 30001, tranche_max: 50000, rate: 0.10, deduction_fixe: 3000, abattement_rate: 0,
    effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B',
    loi_finances: 'LF 2026', created_at: '' },
  { id: 'b2', law_id: 'law-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 50001, tranche_max: 60000, rate: 0.20, deduction_fixe: 8000, abattement_rate: 0,
    effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B',
    loi_finances: 'LF 2026', created_at: '' },
  { id: 'b5', law_id: 'law-2026', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 180001, tranche_max: null, rate: 0.38, deduction_fixe: 24400, abattement_rate: 0,
    effective_date: '2026-01-01', expiration_date: null, article_cgi: 'Art. 73-II-B',
    loi_finances: 'LF 2026', created_at: '' },
]

function makeInput(loyerMensuel: number, regime: 'forfaitaire' | 'reel' = 'forfaitaire'): TaxInput {
  const year = 2026
  const paiements = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`, date: `${year}-${String(i + 1).padStart(2, '0')}-01`,
    montant: loyerMensuel, statut: 'paye' as const
  }))
  return {
    fiscal_year: year,
    bien: {
      id: 'b1', type: 'appartement', usage: 'habitation',
      adresse: '5 rue Mohammed V', ville: 'Casablanca',
      valeur_acquisition: 600000, date_acquisition: '2020-01-01',
      surface: 90, quote_part: 1.0
    },
    contrat: {
      loyer_mensuel: loyerMensuel, charges_mensuelles: 0,
      avances: 0, date_debut: `${year}-01-01`, type_bail: 'habitation', paiements
    },
    options: { regime, is_simulation: true }
  }
}

const CONTEXT: FiscalContext = {
  laws: [LAW_2026],
  brackets: BRACKETS,
  rules: [],
  exemptions: []
}

describe('IRFoncierCalculator', () => {
  let calculator: IRFoncierCalculator

  beforeEach(() => { calculator = new IRFoncierCalculator() })

  it('produit exactement 14 étapes', async () => {
    const result = await calculator.calculate(makeInput(5000), CONTEXT)
    expect(result.steps).toHaveLength(14)
    expect(result.steps.map(s => s.step_number)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    )
  })

  it('loyer 5000/mois → revenu brut 60 000 DH', async () => {
    const result = await calculator.calculate(makeInput(5000), CONTEXT)
    expect(result.revenu_brut).toBe(60000)
  })

  it('forfaitaire : RNI = brut × 60% = 36 000', async () => {
    const result = await calculator.calculate(makeInput(5000), CONTEXT)
    expect(result.abattement).toBe(24000)  // 60000 × 40%
    expect(result.revenu_net_imposable).toBe(36000)
  })

  it('exonération totale : brut ≤ 30 000 → impôt net = 0', async () => {
    const result = await calculator.calculate(makeInput(2000), CONTEXT)
    expect(result.revenu_brut).toBe(24000)
    expect(result.impot_net).toBe(0)
  })

  it('barème : RNI 36 000 → taux 10%, impôt = 36000 × 10% - 3000 = 600', async () => {
    const result = await calculator.calculate(makeInput(5000), CONTEXT)
    expect(result.impot_brut).toBe(600)
    expect(result.impot_net).toBe(600)
  })
})
