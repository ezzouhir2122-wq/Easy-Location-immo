# Focus Actuel — Easy Location Immo

**Semaine du :** 2026-06-28

## Top 3 Priorités Phase 1
1. **Setup technique** : Next.js + Supabase + Tailwind configurés et démarrés
2. **Schéma DB** : tables `biens`, `locataires`, `contrats`, `paiements` avec RLS
3. **Auth + Module Biens** : connexion propriétaire + CRUD biens opérationnel

## Blocages Identifiés
- Aucun pour l'instant

## Décisions en Attente
- Choix du domaine final (easy-location-immo.fr ?)
- Stratégie multi-tenant (1 DB partagée avec RLS vs schémas séparés)
- Phase 1 : paiements Stripe oui/non ?

## Prochaine Milestone
MVP fonctionnel : propriétaire peut se connecter, ajouter des biens et des locataires, voir son dashboard.

## Ordre de Développement Suggéré
1. `npx create-next-app@latest` + config Tailwind + shadcn/ui
2. Setup Supabase (projet, tables, RLS)
3. Auth (login/register propriétaire)
4. Layout principal + navigation
5. Module Biens (liste + fiche + ajout/édition)
6. Module Locataires (liste + fiche)
7. Module Contrats (bail simple)
8. Module Paiements (suivi loyers + quittance PDF)
9. Dashboard KPIs
10. Déploiement Vercel
