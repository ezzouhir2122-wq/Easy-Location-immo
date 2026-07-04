// Taxe d'Habitation — CGI Art. 30 à 42, LF 2026
import type { TaxeHabitationInput, TaxeHabitationResult, TaxStep, RiskFlag } from './types'

// Barème progressif TH 2026 (Art. 31 CGI)
const TH_BRACKETS = [
  { min: 0,     max: 5_000,  rate: 0,    deduction: 0     },
  { min: 5_001, max: 20_000, rate: 0.10, deduction: 0     },
  { min: 20_001,max: 40_000, rate: 0.20, deduction: 2_000 },
  { min: 40_001,max: null,   rate: 0.30, deduction: 6_000 },
]

const ABATTEMENT_RP_RATE = 0.75  // Art. 35 CGI
const ABATTEMENT_PAR_CHARGE = 360 // DH par personne à charge — Art. 36 CGI
const MAX_PERSONNES_CHARGE = 6

export class TaxeHabitationCalculator {
  calculate(input: TaxeHabitationInput): TaxeHabitationResult {
    const steps: TaxStep[] = []
    const risks: RiskFlag[] = []
    const vla = input.vla_annuelle

    // Étape 1 : VLA
    steps.push({
      step_number: 1,
      label: 'Valeur Locative Annuelle (VLA)',
      formula: `${vla.toLocaleString('fr-FR')} DH`,
      inputs: { vla },
      result: vla,
      article_cgi: 'Art. 30 CGI',
    })

    // Étape 2 : Trouver la tranche applicable
    const bracket = TH_BRACKETS.find(b => vla <= (b.max ?? Infinity)) ?? TH_BRACKETS[TH_BRACKETS.length - 1]
    const th_brut_raw = (vla * bracket.rate) - bracket.deduction
    const th_brut = Math.max(0, th_brut_raw)
    steps.push({
      step_number: 2,
      label: `TH brut — tranche ${(bracket.rate * 100).toFixed(0)}%`,
      formula: `(${vla.toLocaleString('fr-FR')} × ${(bracket.rate * 100).toFixed(0)}%) − ${bracket.deduction.toLocaleString('fr-FR')}`,
      inputs: { vla, taux: bracket.rate, deduction_fixe: bracket.deduction },
      result: th_brut,
      article_cgi: 'Art. 31 CGI',
    })

    // Étape 3 : Abattement résidence principale (75%)
    const abattement_rp = input.residence_principale ? Math.round(th_brut * ABATTEMENT_RP_RATE) : 0
    steps.push({
      step_number: 3,
      label: input.residence_principale
        ? 'Abattement résidence principale (75%)'
        : 'Abattement résidence principale (non applicable)',
      formula: input.residence_principale
        ? `${th_brut.toLocaleString('fr-FR')} × 75%`
        : '0',
      inputs: { th_brut, taux_abattement: input.residence_principale ? 0.75 : 0 },
      result: abattement_rp,
      article_cgi: 'Art. 35 CGI',
    })

    // Étape 4 : Abattement familial
    const nb_charge = Math.min(input.nb_personnes_charge, MAX_PERSONNES_CHARGE)
    const abattement_familial = nb_charge * ABATTEMENT_PAR_CHARGE
    steps.push({
      step_number: 4,
      label: `Abattement familial (${nb_charge} personne${nb_charge > 1 ? 's' : ''} à charge)`,
      formula: `${nb_charge} × ${ABATTEMENT_PAR_CHARGE} DH`,
      inputs: { nb_personnes_charge: nb_charge, montant_par_personne: ABATTEMENT_PAR_CHARGE },
      result: abattement_familial,
      article_cgi: 'Art. 36 CGI',
    })

    // Étape 5 : TH net
    const th_net = Math.max(0, th_brut - abattement_rp - abattement_familial)
    steps.push({
      step_number: 5,
      label: 'TH net à payer',
      formula: `${th_brut.toLocaleString('fr-FR')} − ${abattement_rp.toLocaleString('fr-FR')} − ${abattement_familial.toLocaleString('fr-FR')}`,
      inputs: { th_brut, abattement_rp, abattement_familial },
      result: th_net,
      article_cgi: 'Art. 40 CGI',
    })

    // Risques
    if (vla > 40_000) {
      risks.push({
        code: 'TH_TRANCHE_MAX',
        severity: 'info',
        message: 'Tranche maximale (30%) — la VLA dépasse 40 000 DH/an',
        article_cgi: 'Art. 31 CGI',
      })
    }
    if (input.nb_personnes_charge > MAX_PERSONNES_CHARGE) {
      risks.push({
        code: 'TH_PLAFOND_CHARGES',
        severity: 'info',
        message: `Plafond de ${MAX_PERSONNES_CHARGE} personnes à charge atteint — excédent non pris en compte`,
        article_cgi: 'Art. 36 CGI',
      })
    }

    return {
      fiscal_year: input.fiscal_year,
      vla,
      th_brut,
      abattement_rp,
      abattement_familial,
      th_net,
      steps,
      risques_fiscaux: risks,
      computed_at: new Date().toISOString(),
    }
  }
}
