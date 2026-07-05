# Memory Log — Easy Location Immo

> Append-only. Une entrée par session de travail.

---

## 2026-07-05 — Session Phase B suite + Déclaration IR

**Travail effectué :**
- Ajout page `/fiscalite/declaration` : état IR par bien basé sur loyers réellement encaissés (statut paye/partiel)
- Composant `BienIRCard` : icône type bien, StatusBadge (Non loué / Exonéré / Imposable), revenus encaissés, IR net, taux effectif
- `getLoyersByYear(year)` dans `loyers.ts` : 1 requête Supabase pour toute l'année, filtrage client-side par bien_id
- Modal détail : 14 étapes TaxStepCard + RiskFlag + bouton impression perception
- Combobox année fiscale : input[list] HTML natif + datalist 2017-2026, saisie libre 2000-2099
- Mise à jour sidebar : lien "Déclaration" (📋) entre Calculateur IR et Simulation
- 3 déploiements Vercel production (commits fbce027, 167b3d3, 8913fcf)
- Mise à jour live/state.md, live/tasks.md, intel/focus.md, decisions/ledger.md
- Création .wolf/ (anatomy, memory, cerebrum, buglog)

**Branche :** feat/phase-b-fiscalite (non mergée dans master)
**Commits session :** fbce027, 167b3d3, 8913fcf

---

## 2026-07-04 — Session Phase B Fiscalité

**Travail effectué :**
- Phase B : TVACalculator + TaxeHabitationCalculator + TSCCalculator (calculateurs standalone)
- 26 tests Vitest supplémentaires (49 total, 7 fichiers)
- Seed SQL Phase B : `supabase/seed/fiscal_phase_b_seed.sql`
- 3 pages UI : /fiscalite/tva, /fiscalite/taxe-habitation, /fiscalite/tsc
- Fix TaxEngine : STATIC_BRACKETS_2026 fallback + loadContext() .catch(() => [])
- Fix IRFoncierCalculator step 12 : result: tranche.rate * 100, unit: '%'
- Fix TaxStepCard : rendu conditionnel par unit (DH / % / '')
- Calculateur IR : auto-calc debounce 400ms + bouton 💾 save
- Configuration : tab "bareme" par défaut + STATIC_LAW + STATIC_BRACKETS initial state
- Migration : 20260704_fiscal_grants.sql (GRANT SELECT fiscal tables)
- Seeds : fiscal_brackets_only.sql + fiscal_reset_complet.sql
- Déploiement Vercel production (commit fbce027)

---

## 2026-07-04 — Session Phase A Fiscalité

**Travail effectué :**
- Phase A IR Foncier : 5 tables Supabase + seed CGI LF 2024/2025/2026
- Moteur fiscal complet : TaxEngine + IRFoncierCalculator + BracketResolver + RuleEvaluator + ExemptionResolver
- Types TypeScript (types.ts) : TaxInput, TaxResult, TaxStep, Regime, BailType, PropertyType, Paiement
- Hooks React : useTaxCalculation + useTaxSimulation
- 8 composants UI + 6 pages fiscalité
- 23 tests Vitest (4 fichiers)
- Build production ✅, mergé dans master
