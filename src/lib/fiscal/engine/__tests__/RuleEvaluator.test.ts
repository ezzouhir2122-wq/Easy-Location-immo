import { describe, it, expect } from 'vitest'
import { RuleEvaluator } from '../RuleEvaluator'

describe('RuleEvaluator', () => {
  const evaluator = new RuleEvaluator()

  describe('evaluateFormula', () => {
    it('multiply : 120000 × 0.4 = 48000', () => {
      const result = evaluator.evaluateFormula(
        { op: 'multiply', field: 'revenus_encaisses', factor: 0.4 },
        { revenus_encaisses: 120000 }
      )
      expect(result).toBe(48000)
    })

    it('fixed : retourne la valeur fixe', () => {
      const result = evaluator.evaluateFormula(
        { op: 'fixed', value: 5000 },
        {}
      )
      expect(result).toBe(5000)
    })

    it('max_zero : retourne 0 si négatif', () => {
      const result = evaluator.evaluateFormula(
        { op: 'max_zero', formula: { op: 'multiply', field: 'val', factor: -1 } },
        { val: 5000 }
      )
      expect(result).toBe(0)
    })

    it('sum : additionne plusieurs champs', () => {
      const result = evaluator.evaluateFormula(
        { op: 'sum', fields: ['a', 'b', 'c'] },
        { a: 1000, b: 2000, c: 3000 }
      )
      expect(result).toBe(6000)
    })
  })

  describe('evaluateConditions', () => {
    it('lte : 30000 ≤ 30000 → true', () => {
      expect(evaluator.evaluateConditions(
        [{ field: 'revenu_brut', op: 'lte', value: 30000 }],
        { revenu_brut: 30000 }
      )).toBe(true)
    })

    it('lte : 30001 > 30000 → false', () => {
      expect(evaluator.evaluateConditions(
        [{ field: 'revenu_brut', op: 'lte', value: 30000 }],
        { revenu_brut: 30001 }
      )).toBe(false)
    })

    it('eq string : "forfaitaire" → true', () => {
      expect(evaluator.evaluateConditions(
        [{ field: 'regime', op: 'eq', value: 'forfaitaire' }],
        { regime: 'forfaitaire' }
      )).toBe(true)
    })

    it('in : "commercial" dans ["commercial","professionnel"] → true', () => {
      expect(evaluator.evaluateConditions(
        [{ field: 'type_bail', op: 'in', values: ['commercial', 'professionnel'] }],
        { type_bail: 'commercial' }
      )).toBe(true)
    })

    it('conditions vides → true', () => {
      expect(evaluator.evaluateConditions([], {})).toBe(true)
    })
  })
})
