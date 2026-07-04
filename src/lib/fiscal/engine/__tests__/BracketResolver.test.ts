import { describe, it, expect } from 'vitest'
import { BracketResolver } from '../BracketResolver'
import type { TaxBracketRow } from '../types'

const BRACKETS_IR_2026: TaxBracketRow[] = [
  { id: '1', law_id: 'l1', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 0,      tranche_max: 30000,  rate: 0,    deduction_fixe: 0,
    abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null,
    article_cgi: 'Art. 73-II-B', loi_finances: 'LF 2026', created_at: '' },
  { id: '2', law_id: 'l1', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 30001,  tranche_max: 50000,  rate: 0.10, deduction_fixe: 3000,
    abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null,
    article_cgi: 'Art. 73-II-B', loi_finances: 'LF 2026', created_at: '' },
  { id: '3', law_id: 'l1', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 50001,  tranche_max: 60000,  rate: 0.20, deduction_fixe: 8000,
    abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null,
    article_cgi: 'Art. 73-II-B', loi_finances: 'LF 2026', created_at: '' },
  { id: '4', law_id: 'l1', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 80001, tranche_max: 180000, rate: 0.34, deduction_fixe: 17200,
    abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null,
    article_cgi: 'Art. 73-II-B', loi_finances: 'LF 2026', created_at: '' },
  { id: '5', law_id: 'l1', tax_type: 'ir_foncier', property_type: null, usage_type: null,
    tranche_min: 180001, tranche_max: null,   rate: 0.38, deduction_fixe: 24400,
    abattement_rate: 0, effective_date: '2026-01-01', expiration_date: null,
    article_cgi: 'Art. 73-II-B', loi_finances: 'LF 2026', created_at: '' },
]

describe('BracketResolver', () => {
  const resolver = new BracketResolver()

  it('RNI = 0 → taux 0%', () => {
    const b = resolver.resolve(0, BRACKETS_IR_2026)
    expect(b.rate).toBe(0)
  })

  it('RNI = 25000 (≤ 30000) → taux 0%', () => {
    const b = resolver.resolve(25000, BRACKETS_IR_2026)
    expect(b.rate).toBe(0)
  })

  it('RNI = 40000 (30001-50000) → taux 10%, déduction 3000', () => {
    const b = resolver.resolve(40000, BRACKETS_IR_2026)
    expect(b.rate).toBe(0.10)
    expect(b.deduction_fixe).toBe(3000)
  })

  it('RNI = 200000 (> 180000) → taux 38%, déduction 24400', () => {
    const b = resolver.resolve(200000, BRACKETS_IR_2026)
    expect(b.rate).toBe(0.38)
    expect(b.deduction_fixe).toBe(24400)
  })

  it('calcul impôt : RNI = 40000 → 40000 × 10% - 3000 = 1000', () => {
    const b = resolver.resolve(40000, BRACKETS_IR_2026)
    const impot = resolver.calculateTax(40000, b)
    expect(impot).toBe(1000)
  })

  it('calcul impôt : RNI = 0 → 0', () => {
    const b = resolver.resolve(0, BRACKETS_IR_2026)
    const impot = resolver.calculateTax(0, b)
    expect(impot).toBe(0)
  })
})
