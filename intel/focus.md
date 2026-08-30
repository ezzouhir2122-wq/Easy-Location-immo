# Focus Actuel — Easy Location Immo

**Semaine du :** 2026-08-30

## Statut Global
MVP Phase 1 + Fiscalité Phase A & B livrés. Pivot vers une plateforme marocaine de conciergerie et comptabilité immobilière.
Branche active : `feat/phase-b-fiscalite` (à merger dans master via PR #3).

## Top 3 Priorités Immédiates
1. Exécuter et vérifier la migration conciergerie/comptabilité dans Supabase
2. Construire la validation du journal comptable et les états par bien
3. Ajouter le calendrier visuel et les filtres avancés de conciergerie

## Blocages
- Aucun

## Décisions en Attente
- Phase C : export PDF → librairie ou window.print() amélioré ?
- Assistant IA Fiscal : OpenAI API ou Claude API ?
- Domaine final (easy-location-immo.fr ?)

## Prochaine Milestone
**Phase Opérations** : réservations, calendrier, tâches et KPIs de conciergerie

## Contexte Technique Actuel
- 49 tests Vitest passants (7 fichiers)
- 26 routes Vercel, build 0 erreur TypeScript
- Barème IR 2026 : fallback statique actif dans TaxEngine (DB non requise)
- Supabase seed optionnel : `supabase/seed/fiscal_reset_complet.sql`
