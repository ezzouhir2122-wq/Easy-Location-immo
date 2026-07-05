import { RuleEvaluator } from './RuleEvaluator'
import { BracketResolver } from './BracketResolver'
import { ExemptionResolver } from './ExemptionResolver'
import type {
  TaxInput, TaxResult, TaxStep, FiscalContext,
  TaxBracketRow, AppliedRule, LawReference, RiskFlag
} from './types'

// Méthode de calcul conforme à l'exemple DGI (CGI Art. 61, 64, 73, 160) :
// Encaissés → TSC déduit → Syndic déduit → Base avant abattement
// → Abattement 40% (forfaitaire) → RNI → Barème → IR brut
// → Réductions famille (500 DH/pers) → Retenue source 10% (PM) → IR net

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
    const nbPersonnes = input.options?.nb_personnes_charge ?? 0

    // ── Étapes 1-3 : revenus ──────────────────────────────────────────────────
    const revenuBrut = this.step1RevenuBrut(input, steps)
    const revenusEncaisses = this.step2Encaisses(input, year, steps)
    const revenusNonEncaisses = this.step3NonEncaisses(revenuBrut, revenusEncaisses, steps)

    // ── Étapes 4-5 : TSC et syndic (toujours déductibles, Art. 64 CGI) ───────
    const tscDeduit = this.step4TSC(revenusEncaisses, steps, rulesApplied)
    const chargesSyndic = this.step5Syndic(input, steps)

    // ── Étape 6 : déductions réelles (régime réel uniquement) ─────────────────
    const deductionsReelles = this.step6DeductionsReelles(input, regime, steps)

    // ── Étape 7 : total déductions ────────────────────────────────────────────
    const totalDeductions = tscDeduit + chargesSyndic + deductionsReelles
    steps.push({
      step_number: 7,
      label: 'Total des déductions',
      formula: `TSC ${tscDeduit.toLocaleString('fr-FR')} + Syndic ${chargesSyndic.toLocaleString('fr-FR')}` +
        (deductionsReelles > 0 ? ` + Réel ${deductionsReelles.toLocaleString('fr-FR')}` : '') +
        ` = ${totalDeductions.toLocaleString('fr-FR')} DH`,
      inputs: { tsc: tscDeduit, syndic: chargesSyndic, reelles: deductionsReelles },
      result: totalDeductions,
      article_cgi: 'Art. 64 CGI',
    })

    // ── Étape 8 : base avant abattement ──────────────────────────────────────
    const baseAvant = Math.max(0, revenusEncaisses - tscDeduit - chargesSyndic)
    steps.push({
      step_number: 8,
      label: 'Base avant abattement',
      formula: `${revenusEncaisses.toLocaleString('fr-FR')} − ${tscDeduit.toLocaleString('fr-FR')} (TSC) − ${chargesSyndic.toLocaleString('fr-FR')} (syndic) = ${baseAvant.toLocaleString('fr-FR')} DH`,
      inputs: { revenus_encaisses: revenusEncaisses, tsc: tscDeduit, syndic: chargesSyndic },
      result: baseAvant,
      article_cgi: 'Art. 64 CGI',
    })

    // ── Exonérations ─────────────────────────────────────────────────────────
    const condCtx = {
      revenu_brut: revenuBrut, regime, type_bail: input.contrat.type_bail,
      surface: input.bien.surface, valeur_acquisition: input.bien.valeur_acquisition,
      usage: input.bien.usage, is_vefa: false
    }
    const exemptions = this.exemptionResolver.resolve(ctx.exemptions, input, condCtx)
    const fullyExempt = this.exemptionResolver.hasFullExemption(exemptions)

    // ── Étape 9 : abattement ──────────────────────────────────────────────────
    const { abattement, baseImposable } = this.step9Abattement(
      baseAvant, deductionsReelles, regime, fullyExempt, steps, rulesApplied
    )

    // ── Étape 10 : RNI ────────────────────────────────────────────────────────
    const rni = fullyExempt ? 0 : baseImposable
    steps.push({
      step_number: 10,
      label: 'Revenu Net Imposable',
      formula: fullyExempt
        ? 'Exonération totale → 0 DH'
        : regime === 'forfaitaire'
          ? `${baseAvant.toLocaleString('fr-FR')} − ${abattement.toLocaleString('fr-FR')} (40%) = ${rni.toLocaleString('fr-FR')} DH`
          : `${revenusEncaisses.toLocaleString('fr-FR')} − ${totalDeductions.toLocaleString('fr-FR')} = ${rni.toLocaleString('fr-FR')} DH`,
      inputs: { base: baseAvant, abattement },
      result: rni,
      article_cgi: 'Art. 73-II-B CGI',
    })

    // ── Étapes 11-12 : barème ─────────────────────────────────────────────────
    const irBrackets = ctx.brackets.filter(b => b.tax_type === 'ir_foncier')
    const tranche: TaxBracketRow = irBrackets.length > 0
      ? this.bracketResolver.resolve(rni, irBrackets)
      : this.fallbackBracket(rni)

    steps.push({
      step_number: 11,
      label: 'Application du barème IR foncier',
      formula: `Tranche ${tranche.tranche_min.toLocaleString('fr-FR')} — ${tranche.tranche_max?.toLocaleString('fr-FR') ?? '∞'} DH → Taux ${(tranche.rate * 100).toFixed(1)}%`,
      inputs: { rni, tranche_min: tranche.tranche_min, tranche_max: tranche.tranche_max ?? 0, taux: tranche.rate },
      result: tranche.rate * 100,
      unit: '%',
      article_cgi: tranche.article_cgi ?? 'Art. 73-II-B CGI',
    })

    const impotBrut = this.bracketResolver.calculateTax(rni, tranche)
    steps.push({
      step_number: 12,
      label: "Calcul de l'impôt brut",
      formula: `${rni.toLocaleString('fr-FR')} × ${(tranche.rate * 100).toFixed(1)}% − ${tranche.deduction_fixe.toLocaleString('fr-FR')} = ${impotBrut.toLocaleString('fr-FR')} DH`,
      inputs: { rni, taux: tranche.rate, deduction_fixe: tranche.deduction_fixe },
      result: impotBrut,
      article_cgi: 'Art. 73-II-B CGI',
    })

    // ── Étape 13 : réductions charges de famille (Art. 74 CGI) ───────────────
    const reductionFamille = this.step13Famille(nbPersonnes, steps, rulesApplied)

    // ── Étape 14 : retenue à la source 10% (locataire PM, Art. 160 CGI) ──────
    const retenue = this.step14RetenueSource(input, revenusEncaisses, steps, rulesApplied)

    // ── Étape 15 : IR net à payer ─────────────────────────────────────────────
    const impotNet = Math.max(0, impotBrut - reductionFamille - retenue)
    const restitution = retenue > 0 && retenue > (impotBrut - reductionFamille)
      ? retenue - Math.max(0, impotBrut - reductionFamille) : 0
    steps.push({
      step_number: 15,
      label: 'IR net à payer',
      formula: [
        `${impotBrut.toLocaleString('fr-FR')}`,
        reductionFamille > 0 ? `− ${reductionFamille.toLocaleString('fr-FR')} (famille)` : '',
        retenue > 0 ? `− ${retenue.toLocaleString('fr-FR')} (retenue source)` : '',
        `= ${impotNet.toLocaleString('fr-FR')} DH`,
      ].filter(Boolean).join(' '),
      inputs: { impot_brut: impotBrut, reduction_famille: reductionFamille, retenue_source: retenue },
      result: impotNet,
      article_cgi: 'Art. 73-II-B CGI',
    })

    // ── Alertes ───────────────────────────────────────────────────────────────
    if (revenusNonEncaisses > 0) {
      riskFlags.push({
        code: 'loyers_impayes',
        severity: 'warning',
        message: `${revenusNonEncaisses.toLocaleString('fr-FR')} DH de loyers non encaissés — conservez les preuves (mise en demeure, acte judiciaire)`,
        article_cgi: 'Art. 61-II CGI',
      })
    }
    if (restitution > 0) {
      riskFlags.push({
        code: 'restitution_impot',
        severity: 'info',
        message: `L'État vous doit une restitution de ${restitution.toLocaleString('fr-FR')} DH (retenue source > IR dû)`,
        article_cgi: 'Art. 160 CGI',
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
      tsc_deduit: tscDeduit,
      charges_syndic: chargesSyndic,
      total_deductions: totalDeductions,
      abattement,
      revenu_net_imposable: rni,
      tranche_appliquee: tranche,
      impot_brut: impotBrut,
      reduction_famille: reductionFamille,
      retenue_source: retenue,
      impot_net: impotNet,
      exemptions_appliquees: exemptions,
      rules_applied: rulesApplied,
      laws_referenced: lawsReferenced,
      risques_fiscaux: riskFlags,
      computed_at: new Date().toISOString(),
    }
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

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
    })
    return nonEncaisses
  }

  private step4TSC(encaisses: number, steps: TaxStep[], rulesApplied: AppliedRule[]): number {
    const tsc = Math.round(encaisses * 0.105 * 100) / 100
    rulesApplied.push({
      rule_key: 'ir_foncier.tsc_deductible',
      label: 'TSC déductible (10.5% des revenus bruts)',
      category: 'deduction', article_cgi: 'Art. 64-II CGI',
      amount_impact: -tsc,
    })
    steps.push({
      step_number: 4,
      label: 'TSC déductible (10.5% — Art. 64-II CGI)',
      formula: `${encaisses.toLocaleString('fr-FR')} × 10.5% = ${tsc.toLocaleString('fr-FR')} DH`,
      inputs: { revenus_encaisses: encaisses, taux_tsc: 0.105 },
      result: tsc,
      article_cgi: 'Art. 64-II CGI',
    })
    return tsc
  }

  private step5Syndic(input: TaxInput, steps: TaxStep[]): number {
    const annuel = (input.contrat.charges_mensuelles ?? 0) * 12 * input.bien.quote_part
    steps.push({
      step_number: 5,
      label: 'Charges de syndic annuelles',
      formula: annuel > 0
        ? `${input.contrat.charges_mensuelles.toLocaleString('fr-FR')} × 12 mois × ${input.bien.quote_part} = ${annuel.toLocaleString('fr-FR')} DH`
        : '0 DH',
      inputs: { charges_mensuelles: input.contrat.charges_mensuelles ?? 0 },
      result: annuel,
      article_cgi: 'Art. 64-II CGI',
    })
    return annuel
  }

  private step6DeductionsReelles(input: TaxInput, regime: string, steps: TaxStep[]): number {
    const d = input.deductions
    const total = regime === 'reel'
      ? (d?.travaux ?? 0) + (d?.interets_emprunts ?? 0) + (d?.assurances ?? 0) + (d?.frais_gestion ?? 0) + (d?.autres ?? 0)
      : 0
    steps.push({
      step_number: 6,
      label: 'Déductions réelles (régime réel)',
      formula: regime === 'forfaitaire'
        ? 'Non applicable en régime forfaitaire'
        : `Travaux + Intérêts + Assurances + Gestion + Autres = ${total.toLocaleString('fr-FR')} DH`,
      inputs: regime === 'reel' ? {
        travaux: d?.travaux ?? 0, interets: d?.interets_emprunts ?? 0,
        assurances: d?.assurances ?? 0, gestion: d?.frais_gestion ?? 0, autres: d?.autres ?? 0,
      } : {},
      result: total,
      article_cgi: 'Art. 64-II CGI',
    })
    return total
  }

  private step9Abattement(
    baseAvant: number, deductionsReelles: number, regime: string,
    fullyExempt: boolean, steps: TaxStep[], rulesApplied: AppliedRule[]
  ): { abattement: number; baseImposable: number } {
    let abattement: number
    let baseImposable: number
    let formula: string
    if (fullyExempt) {
      abattement = baseAvant
      baseImposable = 0
      formula = 'Exonération totale'
    } else if (regime === 'forfaitaire') {
      abattement = Math.round(baseAvant * 0.4 * 100) / 100
      baseImposable = Math.round((baseAvant - abattement) * 100) / 100
      formula = `${baseAvant.toLocaleString('fr-FR')} × 40% = ${abattement.toLocaleString('fr-FR')} DH`
      rulesApplied.push({
        rule_key: 'ir_foncier.abattement_forfaitaire',
        label: 'Abattement forfaitaire 40%',
        category: 'abattement', article_cgi: 'Art. 64-I CGI',
        amount_impact: -abattement,
      })
    } else {
      // Régime réel : pas d'abattement, on déduit les charges réelles supplémentaires
      abattement = deductionsReelles
      baseImposable = Math.max(0, baseAvant - deductionsReelles)
      formula = `Déductions réelles = ${abattement.toLocaleString('fr-FR')} DH`
    }
    steps.push({
      step_number: 9,
      label: regime === 'forfaitaire' ? 'Abattement forfaitaire (40%)' : 'Charges réelles déductibles',
      formula,
      inputs: { base_avant: baseAvant, taux: regime === 'forfaitaire' ? 0.4 : 0 },
      result: abattement,
      article_cgi: 'Art. 64-I CGI',
    })
    return { abattement, baseImposable }
  }

  private step13Famille(
    nbPersonnes: number, steps: TaxStep[], rulesApplied: AppliedRule[]
  ): number {
    const reduction = nbPersonnes * 500
    if (nbPersonnes > 0) {
      rulesApplied.push({
        rule_key: 'ir_foncier.reduction_charges_famille',
        label: `Réduction charges de famille (${nbPersonnes} pers. × 500 DH)`,
        category: 'deduction', article_cgi: 'Art. 74 CGI',
        amount_impact: -reduction,
      })
    }
    steps.push({
      step_number: 13,
      label: 'Réductions charges de famille',
      formula: nbPersonnes > 0
        ? `${nbPersonnes} personne(s) × 500 DH = ${reduction.toLocaleString('fr-FR')} DH`
        : 'Aucune personne à charge déclarée → 0 DH',
      inputs: { nb_personnes: nbPersonnes, reduction_par_personne: 500 },
      result: reduction,
      article_cgi: 'Art. 74 CGI',
    })
    return reduction
  }

  private step14RetenueSource(
    input: TaxInput, encaisses: number,
    steps: TaxStep[], rulesApplied: AppliedRule[]
  ): number {
    const isLocatairePM = input.contrat.locataire_personne_morale === true
    const isCommercial = ['commercial', 'professionnel'].includes(input.contrat.type_bail)
    const appliquer = isLocatairePM && isCommercial
    // 10% retenus à la source par le locataire PM (Art. 160 CGI)
    const retenue = appliquer ? Math.round(encaisses * 0.10 * 100) / 100 : 0
    if (appliquer) {
      rulesApplied.push({
        rule_key: 'ir_foncier.retenue_source_pm',
        label: 'Retenue à la source 10% — locataire personne morale',
        category: 'retenue_source', article_cgi: 'Art. 160 CGI',
        amount_impact: -retenue,
      })
    }
    steps.push({
      step_number: 14,
      label: 'Retenue à la source (10% — locataire PM)',
      formula: appliquer
        ? `${encaisses.toLocaleString('fr-FR')} × 10% = ${retenue.toLocaleString('fr-FR')} DH (déjà versé à l'État par le locataire)`
        : 'Non applicable — locataire particulier',
      inputs: { revenus_encaisses: encaisses, taux_retenue: appliquer ? 0.10 : 0 },
      result: retenue,
      article_cgi: 'Art. 160 CGI',
    })
    return retenue
  }

  private fallbackBracket(rni: number): TaxBracketRow {
    // Barème LF 2026 DGI (statique si DB vide)
    const BRACKETS = [
      { min: 0,      max: 40000,  rate: 0,    ded: 0 },
      { min: 40001,  max: 60000,  rate: 0.10, ded: 4000 },
      { min: 60001,  max: 80000,  rate: 0.20, ded: 10000 },
      { min: 80001,  max: 100000, rate: 0.30, ded: 18000 },
      { min: 100001, max: 180000, rate: 0.34, ded: 22000 },
      { min: 180001, max: null,   rate: 0.37, ded: 27400 },
    ]
    const b = BRACKETS.find(br => rni >= br.min && (br.max === null || rni <= br.max))
      ?? BRACKETS[BRACKETS.length - 1]
    return {
      id: 'fallback', law_id: '', tax_type: 'ir_foncier',
      property_type: null, usage_type: null,
      tranche_min: b.min, tranche_max: b.max,
      rate: b.rate, deduction_fixe: b.ded, abattement_rate: 0,
      effective_date: '', expiration_date: null,
      article_cgi: 'Art. 73-II-B CGI', loi_finances: 'LF 2026', created_at: ''
    }
  }
}
