// Taxe de Services Communaux — CGI Art. 32, LF 2026
import type { TSCInput, TSCResult, TaxStep, RiskFlag, ZoneType } from './types'

const TSC_RATES: Record<ZoneType, number> = {
  urbain:    0.105,  // 10.5% — commune urbaine (Art. 32-I CGI)
  suburbain: 0.065,  // 6.5%  — zone suburbaine
  rural:     0.065,  // 6.5%  — zone rurale (hors périmètre communal)
}

const TSC_MINIMUM = 100  // DH — Art. 32-II CGI

export class TSCCalculator {
  calculate(input: TSCInput): TSCResult {
    const steps: TaxStep[] = []
    const risks: RiskFlag[] = []
    const taux = TSC_RATES[input.zone]

    // Étape 1 : VLA
    steps.push({
      step_number: 1,
      label: 'Valeur Locative Annuelle (VLA)',
      formula: `${input.vla_annuelle.toLocaleString('fr-FR')} DH`,
      inputs: { vla: input.vla_annuelle },
      result: input.vla_annuelle,
      article_cgi: 'Art. 30 CGI',
    })

    // Étape 2 : Taux selon zone
    const tsc_brut = input.vla_annuelle * taux
    steps.push({
      step_number: 2,
      label: `TSC brut — zone ${input.zone} (${(taux * 100).toFixed(1)}%)`,
      formula: `${input.vla_annuelle.toLocaleString('fr-FR')} × ${(taux * 100).toFixed(1)}%`,
      inputs: { vla: input.vla_annuelle, taux_zone: taux },
      result: tsc_brut,
      article_cgi: 'Art. 32-I CGI',
    })

    // Étape 3 : Application du minimum légal
    const tsc_net = Math.max(tsc_brut, TSC_MINIMUM)
    steps.push({
      step_number: 3,
      label: `TSC net (minimum légal ${TSC_MINIMUM} DH)`,
      formula: `max(${tsc_brut.toLocaleString('fr-FR')}, ${TSC_MINIMUM})`,
      inputs: { tsc_brut, minimum_legal: TSC_MINIMUM },
      result: tsc_net,
      article_cgi: 'Art. 32-II CGI',
    })

    // Risques
    if (tsc_brut < TSC_MINIMUM) {
      risks.push({
        code: 'TSC_MINIMUM_APPLIQUE',
        severity: 'info',
        message: `TSC calculé (${tsc_brut.toFixed(2)} DH) inférieur au minimum légal — montant forfaitaire de ${TSC_MINIMUM} DH appliqué`,
        article_cgi: 'Art. 32-II CGI',
      })
    }

    return {
      fiscal_year: input.fiscal_year,
      vla: input.vla_annuelle,
      taux_zone: taux,
      tsc_brut,
      tsc_net,
      steps,
      risques_fiscaux: risks,
      computed_at: new Date().toISOString(),
    }
  }
}
