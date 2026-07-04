import { describe, it, expect } from 'vitest'
import { ExemptionResolver } from '../ExemptionResolver'
import type { TaxExemptionRow, TaxInput } from '../types'

const makeInput = (revenu_brut: number, usage = 'habitation'): TaxInput => ({
  fiscal_year: 2026,
  bien: {
    id: 'b1', type: 'appartement', usage: usage as any,
    adresse: '1 rue test', ville: 'Casablanca',
    valeur_acquisition: 500000, date_acquisition: '2020-01-01',
    surface: 80, quote_part: 1.0
  },
  contrat: {
    loyer_mensuel: Math.round(revenu_brut / 12),
    charges_mensuelles: 0, avances: 0,
    date_debut: '2026-01-01', type_bail: 'habitation', paiements: []
  },
  options: { regime: 'forfaitaire', is_simulation: false }
})

const EXEMPTION_30K: TaxExemptionRow = {
  id: 'e1', law_id: 'l1', exemption_type: 'permanente',
  label: 'Exonération ≤ 30 000 DH', description: '',
  property_types: [], conditions: [{ field: 'revenu_brut', op: 'lte', value: 30000 }],
  duration_years: null, rate: 1.0, article_cgi: 'Art. 73-II-B',
  note_service_dgi: null, effective_date: '2026-01-01',
  expiration_date: null, enabled: true, created_at: ''
}

describe('ExemptionResolver', () => {
  const resolver = new ExemptionResolver()

  it('revenu ≤ 30000 → exonération acceptée', () => {
    const result = resolver.resolve([EXEMPTION_30K], makeInput(25000), { revenu_brut: 25000 })
    expect(result).toHaveLength(1)
    expect(result[0].accepted).toBe(true)
    expect(result[0].rate).toBe(1.0)
  })

  it('revenu > 30000 → exonération refusée', () => {
    const result = resolver.resolve([EXEMPTION_30K], makeInput(50000), { revenu_brut: 50000 })
    expect(result[0].accepted).toBe(false)
    expect(result[0].rejection_reason).toBeDefined()
  })

  it('sans exonérations → tableau vide', () => {
    const result = resolver.resolve([], makeInput(50000), { revenu_brut: 50000 })
    expect(result).toHaveLength(0)
  })
})
