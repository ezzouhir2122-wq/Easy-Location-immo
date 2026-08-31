# État de Session — Easy Location Immo

**Dernière mise à jour :** 2026-08-31
**Statut :** Merge master — conciergerie + fiscalité Phase B + refonte dashboard UI déployés

## Contexte Rapide
Application de gestion locative. Stack : Next.js 14 + Supabase + Tailwind CSS.
Supabase project : duyueirlwrlekdhubuul.supabase.co
Vercel : https://easy-location-immo.vercel.app

---

## Ce Qui Est Fait

### Infrastructure & Core
- [x] Structure complète du projet (Next.js 14 App Router + TypeScript + Tailwind)
- [x] Refonte premium du dashboard en centre d'actions priorisées
- [x] Navigation sidebar complète avec conciergerie, fiscalité et comptabilité
- [x] Ajout de visuels immobiliers (Marrakech)
- [x] CLAUDE.md, SECURITY.md, COMPLIANCE.md
- [x] Supabase client (browser + server + middleware auth)
- [x] Pages Auth : /login, /register, /auth/callback
- [x] Layout sidebar navy + Dashboard KPIs + graphiques SVG
- [x] Sidebar profil dynamique connecté à Supabase Auth
- [x] Toutes les tables Supabase avec RLS
- [x] Déployé Vercel production ✅

### Modules Métier
- [x] Module Biens : CRUD complet
- [x] Module Locataires : CRUD complet
- [x] Module Loyers : CRUD complet + alertes retard
- [x] Module Charges : CRUD complet
- [x] Module Contrats : CRUD complet
- [x] Module Documents : génération quittance/bail/état des lieux (HTML + window.print)

### Phase A Fiscalité (2026-07-04) ✅ — mergée dans master
- [x] 5 tables Supabase : tax_laws, tax_brackets, tax_rules, tax_exemptions, tax_calculations
- [x] Seed CGI : LF 2024/2025/2026, 21 tranches IR, 6 règles, 4 exonérations
- [x] Moteur fiscal : RuleEvaluator + BracketResolver + ExemptionResolver + IRFoncierCalculator + TaxEngine
- [x] Barème statique 2026 (fallback si DB vide) dans TaxEngine
- [x] Hooks React : useTaxCalculation + useTaxSimulation (debounce 300ms)
- [x] 8 composants UI : TaxStepCard, TaxResultSummary, AuditTimeline, ExemptionBadge, LawReference, RiskFlag, TaxBracketTable, SimulatorSlider
- [x] 6 pages : /fiscalite, /fiscalite/calculateur, /fiscalite/simulation, /fiscalite/audit/[id], /fiscalite/historique, /fiscalite/configuration
- [x] 23 tests Vitest (4 fichiers)
- [x] Build production ✅ — mergé master

### Phase B Fiscalité (2026-07-04 → 2026-07-05) ✅ — branche feat/phase-b-fiscalite
- [x] 3 calculateurs standalone : TVACalculator + TaxeHabitationCalculator + TSCCalculator
- [x] 26 nouveaux tests Vitest (49 total, 7 fichiers)
- [x] 3 pages UI : /fiscalite/tva, /fiscalite/taxe-habitation, /fiscalite/tsc
- [x] Page /fiscalite/declaration — état IR par bien (loyers réellement encaissés)
  - [x] Grille de cartes par bien (BienIRCard) avec StatusBadge (Non loué / Exonéré / Imposable)
  - [x] Bandeau récap 4 KPIs (biens, revenus encaissés, biens imposables, IR total)
  - [x] Modal détail : 14 étapes TaxStepCard + RiskFlag + bouton impression perception
  - [x] Combobox année fiscale : saisie libre (2000-2099) + liste déroulante 2017-2026
  - [x] Sélecteur régime : Forfaitaire / Réel
  - [x] getLoyersByYear() — 1 seule requête Supabase pour tous les loyers de l'année
- [x] Sidebar mise à jour : Déclaration (📋) entre Calculateur IR et Simulation
- [x] Déployé Vercel production ✅ (commit 8913fcf)

### Pivot Conciergerie + Comptabilité (2026-08-30) — socle ajouté
- [x] Réservations de conciergerie avec dates, canaux, commissions et RLS
- [x] Tâches opérationnelles avec coûts, priorités, statuts et RLS
- [x] Plan de comptes, écritures et lignes débit/crédit avec RLS
- [x] Cahier des charges et roadmap produit Maroc dans `docs-projet/`
- [x] Page `/reservations` : création et suivi des séjours
- [x] Page `/taches` : création et suivi des opérations
- [x] Navigation sidebar mise à jour
- [x] Fonction SQL de validation débit/crédit et verrouillage des écritures validées
- [x] Page `/etats` : résultat annuel par bien et export CSV
- [x] Page `/calendrier` : vue mensuelle et filtres de réservations

---

## Sidebar Finale
```
Principal          → Dashboard, Biens, Locataires, Contrats
Finances & Fisc.   → Loyers, Charges, Dashboard Fiscal, Calculateur IR,
                     Déclaration, Simulation, Audit, Historique, Configuration,
                     TVA, Taxe d'Habitation, TSC
Gestion            → Documents, Paramètres
```

---

## Ce Qui Est En Cours
- Pages stub `/calendrier` et `/comptabilite` à implémenter
- 3 tests `IRFoncierCalculator` en échec (non bloquant, build vert)

## Blocages
- Aucun bloquant critique.

## Prochaines Actions Possibles
0. Exécuter `supabase/migrations/20260830_compta_validation.sql` dans Supabase Dashboard
1. **PR #3** : Merger `feat/phase-b-fiscalite` dans `master` sur GitHub
2. **SQL optionnel** : Exécuter `supabase/seed/fiscal_reset_complet.sql` dans Supabase Dashboard pour peupler les barèmes 2026 en DB (non bloquant — fallback statique actif)
3. **Phase C Fiscalité** : Exports PDF/Excel + Assistant IA Fiscal
4. Module Paramètres : profil propriétaire éditable (nom, téléphone, SIRET...)
5. Notifications email : alertes loyers en retard (via Resend)
6. Signature électronique baux (Yousign)

---
*Mettre à jour ce fichier à chaque fin de session.*
