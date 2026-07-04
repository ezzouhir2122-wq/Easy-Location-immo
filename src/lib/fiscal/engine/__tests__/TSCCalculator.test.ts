import { describe, it, expect } from 'vitest'
import { TSCCalculator } from '../TSCCalculator'
import type { TSCInput } from '../types'

const calc = new TSCCalculator()

function makeInput(overrides: Partial<TSCInput> = {}): TSCInput {
  return {
    fiscal_year: 2026,
    vla_annuelle: 24_000,
    zone: 'urbain',
    is_simulation: true,
    ...overrides,
  }
}

describe('TSCCalculator', () => {
  describe('Taux selon zone', () => {
    it('zone urbaine → 10.5%', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 20_000, zone: 'urbain' }))
      expect(r.taux_zone).toBe(0.105)
      expect(r.tsc_brut).toBeCloseTo(2_100)
    })

    it('zone suburbaine → 6.5%', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 20_000, zone: 'suburbain' }))
      expect(r.taux_zone).toBe(0.065)
      expect(r.tsc_brut).toBeCloseTo(1_300)
    })

    it('zone rurale → 6.5%', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 20_000, zone: 'rural' }))
      expect(r.taux_zone).toBe(0.065)
      expect(r.tsc_brut).toBeCloseTo(1_300)
    })
  })

  describe('Minimum légal', () => {
    it('TSC net ≥ 100 DH même si VLA très faible', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 500, zone: 'urbain' })) // 500 × 10.5% = 52.5
      expect(r.tsc_net).toBe(100)
      expect(r.risques_fiscaux.some(f => f.code === 'TSC_MINIMUM_APPLIQUE')).toBe(true)
    })

    it('pas de minimum si TSC > 100', () => {
      const r = calc.calculate(makeInput({ vla_annuelle: 24_000, zone: 'urbain' })) // 24000 × 10.5% = 2520
      expect(r.tsc_net).toBe(r.tsc_brut)
      expect(r.risques_fiscaux).toHaveLength(0)
    })
  })

  it('VLA = 0 → TSC net = 100 (minimum)', () => {
    const r = calc.calculate(makeInput({ vla_annuelle: 0 }))
    expect(r.tsc_net).toBe(100)
  })

  it('produit 3 étapes', () => {
    const r = calc.calculate(makeInput())
    expect(r.steps).toHaveLength(3)
  })

  it('TSC urbain sur VLA 12 000 = 1 260 DH', () => {
    const r = calc.calculate(makeInput({ vla_annuelle: 12_000, zone: 'urbain' }))
    expect(r.tsc_brut).toBeCloseTo(1_260)
    expect(r.tsc_net).toBe(r.tsc_brut)
  })
})
