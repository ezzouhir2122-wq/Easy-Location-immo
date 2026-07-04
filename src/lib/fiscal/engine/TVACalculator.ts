// TVA sur loyers commerciaux — CGI Art. 89-I-6°, 90, 101, 104
import type { TVAInput, TVAResult, TaxStep, RiskFlag } from './types'

const SEUIL_ASSUJETTISSEMENT = 500_000

export class TVACalculator {
  calculate(input: TVAInput): TVAResult {
    const steps: TaxStep[] = []
    const risks: RiskFlag[] = []

    // Étape 1 : CA HT annuel
    const ca_ht = input.loyer_mensuel_ht * input.nb_mois
    steps.push({
      step_number: 1,
      label: "Chiffre d'affaires HT annuel",
      formula: `${input.loyer_mensuel_ht.toLocaleString('fr-FR')} × ${input.nb_mois}`,
      inputs: { loyer_mensuel_ht: input.loyer_mensuel_ht, nb_mois: input.nb_mois },
      result: ca_ht,
      article_cgi: 'Art. 89-I-6° CGI',
    })

    // Risque : seuil d'assujettissement
    if (ca_ht < SEUIL_ASSUJETTISSEMENT && input.assujettissement === 'obligatoire') {
      risks.push({
        code: 'SEUIL_TVA_NON_ATTEINT',
        severity: 'warning',
        message: `CA HT annuel (${ca_ht.toLocaleString('fr-FR')} DH) inférieur au seuil d'assujettissement obligatoire (500 000 DH)`,
        article_cgi: 'Art. 90 CGI',
      })
    }

    // Risque : non assujetti mais simulation
    if (input.assujettissement === 'non_assujetti') {
      risks.push({
        code: 'TVA_NON_APPLICABLE',
        severity: 'info',
        message: "Vous n'êtes pas assujetti à la TVA — simulation indicative uniquement",
        article_cgi: 'Art. 90 CGI',
      })
    }

    // Étape 2 : TVA collectée
    const tva_collectee = ca_ht * input.taux_tva
    steps.push({
      step_number: 2,
      label: 'TVA collectée sur loyers',
      formula: `${ca_ht.toLocaleString('fr-FR')} × ${(input.taux_tva * 100).toFixed(0)}%`,
      inputs: { ca_ht, taux_tva: input.taux_tva },
      result: tva_collectee,
      article_cgi: 'Art. 89 CGI',
    })

    // Étape 3 : TVA déductible sur charges
    const tva_deductible = input.charges_ht * input.taux_tva
    steps.push({
      step_number: 3,
      label: 'TVA déductible sur charges',
      formula: `${input.charges_ht.toLocaleString('fr-FR')} × ${(input.taux_tva * 100).toFixed(0)}%`,
      inputs: { charges_ht: input.charges_ht, taux_tva: input.taux_tva },
      result: tva_deductible,
      article_cgi: 'Art. 101 CGI',
    })

    // Étape 4 : TVA nette à reverser
    const tva_nette = Math.max(0, tva_collectee - tva_deductible)
    steps.push({
      step_number: 4,
      label: 'TVA nette à reverser à la DGI',
      formula: `${tva_collectee.toLocaleString('fr-FR')} − ${tva_deductible.toLocaleString('fr-FR')}`,
      inputs: { tva_collectee, tva_deductible },
      result: tva_nette,
      article_cgi: 'Art. 104 CGI',
    })

    // Risque : TVA déductible > collectée (crédit de TVA)
    if (tva_deductible > tva_collectee) {
      risks.push({
        code: 'CREDIT_TVA',
        severity: 'info',
        message: `Crédit de TVA de ${(tva_deductible - tva_collectee).toLocaleString('fr-FR')} DH — remboursable sur demande`,
        article_cgi: 'Art. 103 CGI',
      })
    }

    return {
      fiscal_year: input.fiscal_year,
      ca_ht_annuel: ca_ht,
      tva_collectee,
      tva_deductible,
      tva_nette,
      steps,
      risques_fiscaux: risks,
      computed_at: new Date().toISOString(),
    }
  }
}
