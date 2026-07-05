# Backlog de Tâches — Easy Location Immo

> Dernière mise à jour : 2026-07-05

---

## Fait — MVP Phase 1 ✅

- [x] Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- [x] Supabase : projet, tables, RLS, migrations
- [x] Auth : login/register propriétaire + middleware protection routes + callback
- [x] Layout principal sidebar + dashboard KPIs
- [x] Module Biens : liste + fiche + CRUD
- [x] Module Locataires : liste + fiche + CRUD
- [x] Module Contrats : création bail + visualisation
- [x] Module Loyers : suivi + enregistrement + alertes retard
- [x] Module Charges : CRUD complet
- [x] Module Documents : quittance + bail + état des lieux (HTML print)
- [x] Dashboard enrichi : taux d'occupation + rentabilité nette + graphiques
- [x] Déploiement Vercel production

## Fait — Fiscalité Phase A ✅

- [x] Moteur IR Foncier Maroc (14 étapes, 2 régimes, barème LF 2026)
- [x] 5 tables Supabase + seed CGI
- [x] 6 pages fiscalité (dashboard, calculateur, simulation, audit, historique, configuration)
- [x] 8 composants fiscaux UI
- [x] 23 tests Vitest

## Fait — Fiscalité Phase B ✅

- [x] TVA, Taxe d'Habitation, TSC — calculateurs + pages
- [x] 26 tests Vitest supplémentaires (49 total)
- [x] Page Déclaration IR (/fiscalite/declaration) — par bien, loyers encaissés réels
- [x] Combobox année fiscale (saisie libre + liste déroulante)
- [x] BienIRCard + modal 14 étapes + impression perception

---

## En Cours

- [ ] PR #3 : merger `feat/phase-b-fiscalite` dans `master`
- [ ] SQL optionnel : `fiscal_reset_complet.sql` dans Supabase Dashboard

---

## Phase C — Priorité Haute

- [ ] Export PDF déclaration IR (bouton "Télécharger PDF" en plus de window.print)
- [ ] Export Excel récap loyers + IR par bien
- [ ] Assistant IA Fiscal : suggestions déductions, alertes seuils, optimisation régime
- [ ] Module Paramètres : profil propriétaire éditable (nom, SIRET, adresse, téléphone)

## Phase D — Priorité Moyenne

- [ ] Notifications email : alertes loyers en retard (Resend)
- [ ] Tests E2E (Playwright) sur les flux critiques
- [ ] Documentation API interne

## Phase 2 — Future

- [ ] Signature électronique des baux (Yousign)
- [ ] Paiement en ligne des loyers (Stripe)
- [ ] Application mobile (PWA)
- [ ] Accès locataire (espace personnel)
- [ ] Encadrement des loyers par zone
- [ ] Import/export Excel locataires/biens

---

## Bugs Connus
- Aucun
