import { RuleEvaluator } from './RuleEvaluator'
import { BracketResolver } from './BracketResolver'
import { ExemptionResolver } from './ExemptionResolver'
import type {
  TaxInput, TaxResult, TaxStep, FiscalContext,
  TaxBracketRow, AppliedRule, LawReference, RiskFlag
} from './types'

export class IRFoncierCalculator {
  private evaluator = new RuleEvaluator()
  private bracketResolver = new BracketResolver()
  private exemptionResolver = new ExemptionResolver()

  async calculate(input: TaxInput, ctx: FiscalContext): Promise<TaxResult> {
    const steps: TaxStep[] = []
    const rulesApplied: AppliedRule[] = []
    const riskFlags: RiskFlag[] = []
    const regime = input.options?.regime ?? 'forfaitaire'
    const year = input.fiscal_year

    const revenuBrut = this.step1RevenuBrut(input, steps)
    const revenusEncaisses = this.step2Encaisses(input, year, steps)
    const revenusNonEncaisses = this.step3NonEncaisses(revenuBrut, revenusEncaisses, steps)
    const deductions = this.steps4to8Deductions(input, regime, steps)
    const totalDeductions = this.step9TotalDeductions(deductions, steps)
    const abattement = this.step10Abattement(revenusEncaisses, totalDeductions, regime, steps, rulesApplied)

    const condCtx = {
      revenu_brut: revenuBrut, regime, type_bail: input.contrat.type_bail,
      surface: input.bien.surface, valeur_acquisition: input.bien.valeur_acquisition,
      usage: input.bien.usage, is_vefa: false
    }
    const exemptions = this.exemptionResolver.resolve(ctx.exemptions, input, condCtx)
    const fullyExempt = this.exemptionResolver.hasFullExemption(exemptions)

    // Étape 11 : RNI
    const rni = fullyExempt ? 0 : Math.max(0, revenusEncaisses - abattement)
    steps.push({
      step_number: 11,
      label: 'Revenu Net Imposable',
      formula: fullyExempt
        ? 'Exonération totale → 0 DH'
        : `${revenusEncaisses.toLocaleString('fr-FR')} − ${abattement.toLocaleString('fr-FR')} = ${rni.toLocaleString('fr-FR')} DH`,
      inputs: { revenus_encaisses: revenusEncaisses, abattement },
      result: rni,
      article_cgi: 'Art. 73-II-B CGI',
    })

    // Étape 12 : Tranche
    const irBrackets = ctx.brackets.filter(b => b.tax_type === 'ir_foncier')
    const tranche: TaxBracketRow = irBrackets.length > 0
      ? this.bracketResolver.resolve(rni, irBrackets)
      : this.fallbackBracket()
    steps.push({
      step_number: 12,
      label: 'Application du barème IR foncier',
      formula: `Tranche ${tranche.tranche_min.toLocaleString('fr-FR')} — ${tranche.tranche_max?.toLocaleString('fr-FR') ?? '∞'} DH → Taux ${(tranche.rate * 100).toFixed(1)}%`,
      inputs: { rni, tranche_min: tranche.tranche_min, tranche_max: tranche.tranche_max ?? 0, taux: tranche.rate },
      result: tranche.rate,
      article_cgi: tranche.article_cgi ?? 'Art. 73-II-B CGI',
    })

    // Étape 13 : Impôt brut
    const impotBrut = this.bracketResolver.calculateTax(rni, tranche)
    steps.push({
      step_number: 13,
      label: 'Calcul de l\'impôt brut',
      formula: `${rni.toLocaleString('fr-FR')} × ${(tranche.rate * 100).toFixed(1)}% − ${tranche.deduction_fixe.toLocaleString('fr-FR')} = ${impotBrut.toLocaleString('fr-FR')} DH`,
      inputs: { rni, taux: tranche.rate, deduction_fixe: tranche.deduction_fixe },
      result: impotBrut,
      article_cgi: 'Art. 73-II-B CGI',
    })

    // Étape 14 : Retenue + net
    const retenue = this.step14RetenueSource(input, revenusEncaisses, steps, rulesApplied)
    const impotNet = Math.max(0, impotBrut - retenue)
    steps.push({
      step_number: 14,
      label: 'Net à payer',
      formula: retenue > 0
        ? `${impotBrut.toLocaleString('fr-FR')} − ${retenue.toLocaleString('fr-FR')} (retenue) = ${impotNet.toLocaleString('fr-FR')} DH`
        : `${impotBrut.toLocaleString('fr-FR')} DH`,
      inputs: { impot_brut: impotBrut, retenue_source: retenue },
      result: impotNet,
      article_cgi: 'Art. 73-II-B CGI',
    })

    if (revenusNonEncaisses > 0) {
      riskFlags.push({
        code: 'loyers_impayes',
        severity: 'warning',
        message: `${revenusNonEncaisses.toLocaleString('fr-FR')} DH de loyers non encaissés — conservez les preuves (mise en demeure, acte judiciaire)`,
        article_cgi: 'Art. 61-II CGI',
      })
    }

    const lawsReferenced: LawReference[] = ctx.laws.map(l => ({
      law_id: l.id, finance_year: l.finance_year,
      law_number: l.law_number, official_ref: l.official_ref
    }))

    return {
      fiscal_year: year, tax_type: 'ir_foncier', regime, steps,
      revenu_brut: revenuBrut,
      revenus_encaisses: revenusEncaisses,
      revenus_non_encaisses: revenusNonEncaisses,
      total_deductions: totalDeductions,
      abattement,
      revenu_net_imposable: rni,
      tranche_appliquee: tranche,
      impot_brut: impotBrut,
      retenue_source: retenue,
      impot_net: impotNet,
      exemptions_appliquees: exemptions,
      rules_applied: rulesApplied,
      laws_referenced: lawsReferenced,
      risques_fiscaux: riskFlags,
      computed_at: new Date().toISOString(),
    }
  }

  private step1RevenuBrut(input: TaxInput, steps: TaxStep[]): number {
    const start = new Date(input.contrat.date_debut)
    const end = input.contrat.date_fin ? new Date(input.contrat.date_fin) : new Date(`${input.fiscal_year}-12-31`)
    const yearStart = new Date(`${input.fiscal_year}-01-01`)
    const yearEnd = new Date(`${input.fiscal_year}-12-31`)
    const from = start > yearStart ? start : yearStart
    const to = end < yearEnd ? end : yearEnd
    const months = Math.max(0, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
    const brut = input.contrat.loyer_mensuel * months * input.bien.quote_part
    steps.push({
      step_number: 1,
      label: 'Revenu brut théorique',
      formula: `${input.contrat.loyer_mensuel.toLocaleString('fr-FR')} × ${months} mois × ${input.bien.quote_part} = ${brut.toLocaleString('fr-FR')} DH`,
      inputs: { loyer_mensuel: input.contrat.loyer_mensuel, mois: months, quote_part: input.bien.quote_part },
      result: brut,
      article_cgi: 'Art. 61 CGI',
    })
    return brut
  }

  private step2Encaisses(input: TaxInput, year: number, steps: TaxStep[]): number {
    const encaisses = input.contrat.paiements
      .filter(p => p.statut !== 'impaye' && new Date(p.date).getFullYear() === year)
      .reduce((sum, p) => sum + p.montant, 0) * input.bien.quote_part
    steps.push({
      step_number: 2,
      label: 'Revenus effectivement encaissés',
      formula: `Σ paiements reçus en ${year} × ${input.bien.quote_part} = ${encaisses.toLocaleString('fr-FR')} DH`,
      inputs: { nb_paiements: input.contrat.paiements.filter(p => p.statut !== 'impaye').length },
      result: encaisses,
      article_cgi: 'Art. 61-II CGI',
    })
    return encaisses
  }

  private step3NonEncaisses(brut: number, encaisses: number, steps: TaxStep[]): number {
    const nonEncaisses = Math.max(0, brut - encaisses)
    steps.push({
      step_number: 3,
      label: 'Revenus non encaissés (loyers impayés)',
      formula: `${brut.toLocaleString('fr-FR')} − ${encaisses.toLocaleString('fr-FR')} = ${nonEncaisses.toLocaleString('fr-FR')} DH`,
      inputs: { revenu_brut: brut, revenus_encaisses: encaisses },
      result: nonEncaisses,
      article_cgi: 'Art. 61-II CGI',
      rule_key: 'ir_foncier.loyers_non_encaisses',
    })
    return nonEncaisses
  }

  private steps4to8Deductions(input: TaxInput, regime: string, steps: TaxStep[]): number[] {
    const d = input.deductions
    const labels = [
      { n: 4, label: 'Déduction travaux',              key: 'travaux',           article: 'Art. 64-II CGI' },
      { n: 5, label: 'Déduction intérêts d\'emprunts', key: 'interets_emprunts', article: 'Art. 64-II CGI' },
      { n: 6, label: 'Déduction assurances',           key: 'assurances',        article: 'Art. 64-II CGI' },
      { n: 7, label: 'Déduction frais de gestion',     key: 'frais_gestion',     article: 'Art. 64-II CGI' },
      { n: 8, label: 'Autres déductions',              key: 'autres',            article: 'Art. 64-II CGI' },
    ]
    return labels.map(({ n, label, key, article }) => {
      const val = regime === 'reel' ? (d?.[key as keyof typeof d] ?? 0) : 0
      steps.push({
        step_number: n, label,
        formula: regime === 'forfaitaire'
          ? 'Non applicable en régime forfaitaire'
          : `${val.toLocaleString('fr-FR')} DH`,
        inputs: { [key]: val },
        result: val,
        article_cgi: article,
        rule_key: `ir_foncier.deduction_${key}`,
      })
      return val
    })
  }

  private step9TotalDeductions(deductions: number[], steps: TaxStep[]): number {
    const total = deductions.reduce((s, v) => s + v, 0)
    steps.push({
      step_number: 9, label: 'Total des déductions',
      formula: `Σ déductions = ${total.toLocaleString('fr-FR')} DH`,
      inputs: {},
      result: total,
      article_cgi: 'Art. 64 CGI',
    })
    return total
  }

  private step10Abattement(
    encaisses: number, deductions: number, regime: string,
    steps: TaxStep[], rulesApplied: AppliedRule[]
  ): number {
    let abattement: number
    let formula: string
    let rule_key: string
    if (regime === 'forfaitaire') {
      abattement = encaisses * 0.4
      formula = `${encaisses.toLocaleString('fr-FR')} × 40% = ${abattement.toLocaleString('fr-FR')} DH`
      rule_key = 'ir_foncier.abattement_forfaitaire'
      rulesApplied.push({ rule_key, label: 'Abattement forfaitaire 40%', category: 'abattement', article_cgi: 'Art. 64-I CGI', amount_impact: abattement })
    } else {
      abattement = deductions
      formula = `Déductions réelles = ${abattement.toLocaleString('fr-FR')} DH`
      rule_key = 'ir_foncier.deduction_travaux'
    }
    steps.push({
      step_number: 10,
      label: regime === 'forfaitaire' ? 'Abattement forfaitaire (40%)' : 'Charges réelles déductibles',
      formula,
      inputs: { revenus_encaisses: encaisses, taux_abattement: regime === 'forfaitaire' ? 0.4 : 0 },
      result: abattement,
      article_cgi: 'Art. 64-I CGI',
      rule_key,
    })
    return abattement
  }

  private step14RetenueSource(
    input: TaxInput, encaisses: number,
    steps: TaxStep[], rulesApplied: AppliedRule[]
  ): number {
    const isProBail = ['commercial', 'professionnel'].includes(input.contrat.type_bail)
    const retenue = isProBail ? encaisses * 0.105 : 0
    if (isProBail) {
      rulesApplied.push({
        rule_key: 'ir_foncier.retenue_source_locataire_pro',
        label: 'Retenue à la source — bail professionnel/commercial',
        category: 'retenue_source', article_cgi: 'Art. 160 CGI',
        amount_impact: -retenue
      })
    }
    return retenue
  }

  private fallbackBracket(): TaxBracketRow {
    return {
      id: 'fallback', law_id: '', tax_type: 'ir_foncier',
      property_type: null, usage_type: null, tranche_min: 0,
      tranche_max: null, rate: 0, deduction_fixe: 0, abattement_rate: 0,
      effective_date: '', expiration_date: null,
      article_cgi: 'Art. 73-II-B CGI', loi_finances: null, created_at: ''
    }
  }
}
