import { describe, it, expect } from 'vitest'
import { TaxeHabitationCalculator } from '../TaxeHabitationCalculator'
import type { TaxeHabitationInput } from '../types'

const calc = new TaxeHabitationCalculator()

function makeInput(overrides: Partial<TaxeHabitationInput> = {}): TaxeHabitationInput {
  return {
    fiscal_year: 2026,
    vla_annuelle: 24_000,
    residence_principale: false,
    nb_personnes_charge: 0,
    is_simulation: true,
    ...overrides,
  }
}

describe('TaxeHabitationCalculator', () => {
  describe('Barème progressif', () => {
    it('VLA ≤ 5 000 → TH brut = 0', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 4_000 }))
      expect(r.th_brut).toBe(0)
    })

    it('VLA = 10 000 → tranche 10%, déduction 0 → TH brut = 1 000', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 10_000 }))
      expect(r.th_brut).toBe(1_000)
    })

    it('VLA = 30 000 → tranche 20%, déduction 2 000 → TH brut = 4 000', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 30_000 }))
      expect(r.th_brut).toBe(4_000) // 30 000 × 0.20 − 2 000
    })

    it('VLA = 60 000 → tranche 30%, déduction 6 000 → TH brut = 12 000', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 60_000 }))
      expect(r.th_brut).toBe(12_000) // 60 000 × 0.30 − 6 000
    })
  })

  describe('Abattements', () => {
    it('abattement résidence principale = 75% du TH brut', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 30_000, residence_principale: true }))
      expect(r.abattement_rp).toBe(3_000)   // 4 000 × 75%
      expect(r.th_net).toBe(1_000)           // 4 000 − 3 000
    })

    it('abattement familial = 360 DH × nb_personnes_charge', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 30_000, nb_personnes_charge: 3 }))
      expect(r.abattement_familial).toBe(1_080) // 3 × 360
    })

    it('plafond abattement familial à 6 personnes', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 60_000, nb_personnes_charge: 10 }))
      expect(r.abattement_familial).toBe(2_160) // max 6 × 360
      expect(r.risques_fiscaux.some(f => f.code === 'TH_PLAFOND_CHARGES')).toBe(true)
    })

    it('TH net plancher à 0', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 6_000, residence_principale: true, nb_personnes_charge: 6 }))
      expect(r.th_net).toBe(0)
    })
  })

  it('alerte tranche maximale si VLA > 40 000', () => {
    const r = calc.calculate(makeInput({ vla_annuelle: 50_000 }))
    expect(r.risques_fiscaux.some(f => f.code === 'TH_TRANCHE_MAX')).toBe(true)
  })

  it('produit 5 étapes', () => {
    const r = calc.calculate(makeInput())
    expect(r.steps).toHaveLength(5)
  })
})
