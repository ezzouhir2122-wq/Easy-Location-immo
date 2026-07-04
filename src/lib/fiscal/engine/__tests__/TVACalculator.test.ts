import { describe, it, expect } from 'vitest'
import { TVACalculator } from '../TVACalculator'
import type { TVAInput } from '../types'

const calc = new TVACalculator()

function makeInput(overrides: Partial<TVAInput> = {}): TVAInput {
  return {
    fiscal_year: 2026,
    loyer_mensuel_ht: 10_000,
    nb_mois: 12,
    taux_tva: 0.20,
    charges_ht: 0,
    assujettissement: 'obligatoire',
    type_location: 'commerciale',
    is_simulation: true,
    ...overrides,
  }
}

describe('TVACalculator', () => {
  it('CA HT annuel = loyer_mensuel_ht × nb_mois', () => {
    const r = calc.calculate(makeInput({ loyer_mensuel_ht: 8_000, nb_mois: 12 }))
    expect(r.ca_ht_annuel).toBe(96_000)
  })

  it('TVA collectée à 20%', () => {
    const r = calc.calculate(makeInput({ loyer_mensuel_ht: 10_000, nb_mois: 12, taux_tva: 0.20 }))
    expect(r.tva_collectee).toBe(24_000)
  })

  it('TVA collectée à 10%', () => {
    const r = calc.calculate(makeInput({ taux_tva: 0.10 }))
    expect(r.tva_collectee).toBe(12_000)
  })

  it('TVA déductible sur charges', () => {
    const r = calc.calculate(makeInput({ charges_ht: 5_000, taux_tva: 0.20 }))
    expect(r.tva_deductible).toBe(1_000)
    expect(r.tva_nette).toBe(24_000 - 1_000)
  })

  it('TVA nette plancher à 0 (crédit de TVA)', () => {
    const r = calc.calculate(makeInput({ loyer_mensuel_ht: 1_000, charges_ht: 50_000, taux_tva: 0.20 }))
    expect(r.tva_nette).toBe(0)
    expect(r.risques_fiscaux.some(f => f.code === 'CREDIT_TVA')).toBe(true)
  })

  it('alerte seuil non atteint si CA < 500 000 et assujettissement obligatoire', () => {
    const r = calc.calculate(makeInput({ loyer_mensuel_ht: 5_000, nb_mois: 12 })) // CA = 60 000
    expect(r.risques_fiscaux.some(f => f.code === 'SEUIL_TVA_NON_ATTEINT')).toBe(true)
  })

  it('info si non assujetti', () => {
    const r = calc.calculate(makeInput({ assujettissement: 'non_assujetti' }))
    expect(r.risques_fiscaux.some(f => f.code === 'TVA_NON_APPLICABLE')).toBe(true)
  })

  it('produit 4 étapes de calcul', () => {
    const r = calc.calculate(makeInput())
    expect(r.steps).toHaveLength(4)
    expect(r.steps[0].step_number).toBe(1)
    expect(r.steps[3].step_number).toBe(4)
  })
})
