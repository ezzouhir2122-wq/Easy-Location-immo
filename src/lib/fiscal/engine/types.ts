// src/lib/fiscal/engine/types.ts

// ─── Énumérations ───────────────────────────────────────────────────────────

export type PropertyType =
  | 'appartement' | 'villa' | 'maison' | 'studio'
  | 'local_commercial' | 'magasin' | 'bureau' | 'entrepot'
  | 'hangar' | 'usine' | 'parking' | 'box' | 'terrain'
  | 'terrain_agricole' | 'immeuble' | 'residence_touristique'
  | 'airbnb' | 'location_saisonniere' | 'bien_mixte'
  | 'logement_social' | 'logement_economique' | 'autre'

export type UsageType = 'habitation' | 'commercial' | 'professionnel' | 'mixte' | 'agricole'
export type BailType = 'habitation' | 'commercial' | 'professionnel' | 'saisonnier'
export type Regime = 'forfaitaire' | 'reel'
export type TaxType = 'ir_foncier' | 'ir_foncier_forfaitaire' | 'tva' | 'taxe_habitation' | 'tsc'
export type LawStatus = 'draft' | 'active' | 'superseded' | 'repealed'
export type RuleCategory = 'exoneration' | 'abattement' | 'deduction' | 'retenue_source' | 'majoration' | 'regime_special'
export type ExemptionType = 'temporaire' | 'permanente' | 'partielle'

// ─── Rows DB (retournés par Supabase) ───────────────────────────────────────

export interface TaxLawRow {
  id: string
  finance_year: number
  law_number: string
  title: string
  publication_date: string
  effective_date: string
  expiration_date: string | null
  official_ref: string
  source_url: string | null
  status: LawStatus
  notes: string | null
  created_at: string
}

export interface TaxBracketRow {
  id: string
  law_id: string
  tax_type: TaxType
  property_type: string | null
  usage_type: string | null
  tranche_min: number
  tranche_max: number | null
  rate: number
  deduction_fixe: number
  abattement_rate: number
  effective_date: string
  expiration_date: string | null
  article_cgi: string | null
  loi_finances: string | null
  created_at: string
}

export interface TaxRuleRow {
  id: string
  law_id: string | null
  category: RuleCategory
  rule_key: string
  label: string
  description: string
  article_cgi: string | null
  note_service_dgi: string | null
  priority: number
  formula: FormulaNode
  conditions: ConditionNode[]
  exceptions: ConditionNode[]
  property_types: string[]
  effective_date: string
  expiration_date: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface TaxExemptionRow {
  id: string
  law_id: string
  exemption_type: ExemptionType
  label: string
  description: string
  property_types: string[]
  conditions: ConditionNode[]
  duration_years: number | null
  rate: number
  article_cgi: string | null
  note_service_dgi: string | null
  effective_date: string
  expiration_date: string | null
  enabled: boolean
  created_at: string
}

// ─── JSONB : Formules et conditions ─────────────────────────────────────────

export type FormulaNode =
  | { op: 'multiply'; field: string; factor: number }
  | { op: 'multiply_fields'; fields: [string, string] }
  | { op: 'subtract'; field: string; minus: string }
  | { op: 'fixed'; value: number }
  | { op: 'bracket_lookup'; tax_type: TaxType }
  | { op: 'sum'; fields: string[] }
  | { op: 'max_zero'; formula: FormulaNode }

export type ConditionNode =
  | { field: string; op: 'lte'; value: number }
  | { field: string; op: 'gte'; value: number }
  | { field: string; op: 'lt';  value: number }
  | { field: string; op: 'gt';  value: number }
  | { field: string; op: 'eq';  value: string | number | boolean }
  | { field: string; op: 'in';  values: (string | number)[] }
  | { op: 'and'; conditions: ConditionNode[] }
  | { op: 'or';  conditions: ConditionNode[] }

// ─── Entrées du moteur ───────────────────────────────────────────────────────

export interface Paiement {
  id: string
  date: string         // ISO date
  montant: number
  statut: 'paye' | 'partiel' | 'impaye'
}

export interface DeductionInput {
  travaux: number
  interets_emprunts: number
  assurances: number
  frais_gestion: number
  autres: number
}

export interface TaxInput {
  fiscal_year: number
  bien: {
    id: string
    type: PropertyType
    usage: UsageType
    adresse: string
    ville: string
    valeur_acquisition: number
    date_acquisition: string  // ISO date
    surface: number
    quote_part: number        // 0 < x ≤ 1
  }
  contrat: {
    loyer_mensuel: number
    charges_mensuelles: number
    avances: number
    date_debut: string        // ISO date
    date_fin?: string         // ISO date
    type_bail: BailType
    paiements: Paiement[]
  }
  deductions?: DeductionInput
  options?: {
    regime: Regime
    is_simulation: boolean
  }
}

// ─── Sorties du moteur ───────────────────────────────────────────────────────

export interface TaxStep {
  step_number: number
  label: string
  formula: string            // expression lisible ex: "120 000 × 0.40"
  inputs: Record<string, number>
  result: number
  article_cgi?: string
  note_dgi?: string
  rule_key?: string
}

export interface AppliedExemption {
  exemption_id: string
  label: string
  type: ExemptionType
  rate: number               // 1.0 = 100% exonéré
  article_cgi: string | null
  accepted: boolean
  rejection_reason?: string  // si accepted = false
}

export interface AppliedRule {
  rule_key: string
  label: string
  category: RuleCategory
  article_cgi: string | null
  amount_impact: number
}

export interface LawReference {
  law_id: string
  finance_year: number
  law_number: string
  official_ref: string
}

export interface RiskFlag {
  code: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  article_cgi?: string
}

export interface TaxResult {
  fiscal_year: number
  tax_type: TaxType
  regime: Regime
  steps: TaxStep[]
  revenu_brut: number
  revenus_encaisses: number
  revenus_non_encaisses: number
  total_deductions: number
  abattement: number
  revenu_net_imposable: number
  tranche_appliquee: TaxBracketRow
  impot_brut: number
  retenue_source: number
  impot_net: number
  exemptions_appliquees: AppliedExemption[]
  rules_applied: AppliedRule[]
  laws_referenced: LawReference[]
  risques_fiscaux: RiskFlag[]
  calculation_id?: string    // défini après sauvegarde
  computed_at: string        // ISO datetime
}

// ─── Contexte interne du moteur ──────────────────────────────────────────────

export interface FiscalContext {
  laws: TaxLawRow[]
  brackets: TaxBracketRow[]
  rules: TaxRuleRow[]
  exemptions: TaxExemptionRow[]
}
