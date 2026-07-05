# Focus Actuel — Easy Location Immo

**Semaine du :** 2026-07-05

## Statut Global
MVP Phase 1 + Fiscalité Phase A & B livrés et déployés en production.
Branche active : `feat/phase-b-fiscalite` (à merger dans master via PR #3).

## Top 3 Priorités Immédiates
1. **PR #3** — Merger `feat/phase-b-fiscalite` dans `master` (GitHub)
2. **Export PDF** — Page Déclaration : ajouter export PDF en plus du window.print
3. **Module Paramètres** — Profil propriétaire éditable (nom, SIRET, adresse)

## Blocages
- Aucun

## Décisions en Attente
- Phase C : export PDF → librairie ou window.print() amélioré ?
- Assistant IA Fiscal : OpenAI API ou Claude API ?
- Domaine final (easy-location-immo.fr ?)

## Prochaine Milestone
**Phase C Fiscalité** : exports PDF/Excel + assistant fiscal intelligent

## Contexte Technique Actuel
- 49 tests Vitest passants (7 fichiers)
- 26 routes Vercel, build 0 erreur TypeScript
- Barème IR 2026 : fallback statique actif dans TaxEngine (DB non requise)
- Supabase seed optionnel : `supabase/seed/fiscal_reset_complet.sql`
