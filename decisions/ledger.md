# Journal de Décisions — Easy Location Immo

## 2026-08-30 — Pivot vers conciergerie et comptabilité immobilière

**Décision :** Étendre Easy Location Immo avec les réservations/séjours, les tâches opérationnelles et un journal comptable double entrée.
**Contexte :** Le besoin cible le marché marocain et combine gestion de conciergerie, comptabilité immobilière et revenus fonciers.
**Raison :** Ces trois briques partagent le bien comme axe analytique et évitent de calculer les revenus à partir de données dupliquées.
**Garde-fous :** RLS par `owner_id`, provenance des écritures, validation débit/crédit, montants en MAD, moteur fiscal présenté comme aide préparatoire.
**Par :** Codex

> Append-only. Ne jamais modifier les entrées existantes.

---

## 2026-07-05 — Page Déclaration IR + Combobox Année Fiscale

**Décision :** Page `/fiscalite/declaration` basée sur loyers réellement encaissés (statut paye/partiel) + combobox année fiscale libre
**Contexte :** Besoin d'un état fiscal par bien pour dépôt à la perception, calculé sur les encaissements réels (pas loyer théorique)
**Raison :** 1 seule requête Supabase (`getLoyersByYear`) pour tous les loyers de l'année, filtrage client-side par bien_id — efficace pour un parc standard
**Architecture :** BienIRCard (grille) + modal 14 étapes + bandeau 4 KPIs + impression perception (window.print)
**Combobox année :** input[list] + datalist HTML natif (2017-2026) — zéro dépendance, saisie libre 2000-2099
**Par :** Claude Sonnet 4.6

---

## 2026-07-04 — Phase B Fiscalité : TVA + TH + TSC

**Décision :** Implémenter TVA, Taxe d'Habitation et TSC comme calculateurs client-side standalone
**Contexte :** Phase A livrait IR Foncier (14 étapes, 23 tests, Supabase). Phase B ajoute 3 nouvelles taxes.
**Raison :** TVA/TH/TSC ont des barèmes stables (CGI 2026) → calculateurs purs sans appel DB, plus rapides, 0 dépendance réseau
**Alternatives considérées :** Stocker les barèmes TH/TSC/TVA en DB (rejeté : sur-engineering pour des taux fixes annuels)
**Résultat :** 3 calculateurs (TVACalculator, TaxeHabitationCalculator, TSCCalculator) + 26 nouveaux tests Vitest (49 total) + 3 pages UI + SQL seed Phase B
**Par :** Claude Sonnet 4.6

---

## 2026-06-28 — Initialisation du Projet

**Décision :** Stack Next.js 14 + Supabase + Tailwind + shadcn/ui
**Contexte :** Projet de gestion locative, besoin de multi-tenant sécurisé, génération PDF, emails
**Raison :** Stack éprouvée, RLS Supabase natif pour isolation des données, shadcn/ui pour DX rapide
**Par :** Structure_Projet Universal Generator

---

## 2026-06-28 — Architecture Multi-Tenant

**Décision :** 1 base de données partagée avec Row Level Security (RLS) par `owner_id`
**Contexte :** Plusieurs propriétaires sur la même instance, données à isoler
**Raison :** Plus simple à opérer qu'une DB par tenant, Supabase RLS gère l'isolation nativement
**Alternatives considérées :** Schémas séparés par tenant (rejeté : complexité opérationnelle)
**Par :** Structure_Projet Universal Generator

---

## 2026-06-28 — Paiements Phase 1

**Décision :** Stripe reporté en Phase 2 — Phase 1 = suivi manuel des paiements uniquement
**Contexte :** MVP prioritaire, Stripe ajoute de la complexité (webhooks, KYC Stripe Connect)
**Raison :** Valider le produit avec les utilisateurs avant d'ajouter la complexité paiements
**Par :** Structure_Projet Universal Generator

---

## 2026-07-03 — Reorganisation Sidebar

**Décision :** Sidebar réduite de 10 sections à 7 (3 groupes)
**Contexte :** Redondance entre Quittances/Documents et Rapports/Dashboard
**Raison :** Quittances = sous-ensemble des Documents (loyers payés). Rapports = analytics déjà dans Dashboard.
**Résultat :** Principal (4 items) / Finances & Fiscalité (3 items) / Gestion (2 items). /quittances et /rapports redirigent.
**Par :** Claude Code

---

## 2026-07-03 — Documents Générés sans PDF natif

**Décision :** Templates HTML + window.print() au lieu d'une lib PDF (jsPDF, Puppeteer)
**Contexte :** Quittances, baux, états des lieux à imprimer
**Raison :** Zéro dépendance externe, rendu natif du navigateur, format A4 via CSS @media print, licences permissives garanties
**Par :** Claude Code

---

## 2026-07-03 — Profil Sidebar dynamique

**Décision :** Profil propriétaire sidebar connecté à Supabase Auth (user_metadata.full_name ou email)
**Contexte :** Nom "Ahmed Bensalem" était hardcodé
**Raison :** Chaque propriétaire doit voir son propre nom, pas un placeholder
**Par :** Claude Code

---

## 2026-07-04 — Phase A Fiscalité — Moteur IR Foncier Maroc

**Décision :** Implémenter un moteur fiscal marocain complet (IR foncier CGI) en 3 parties (DB + Engine + Pages)
**Contexte :** Besoin d'une solution conforme, auditée, sans taux hardcodés — calculer l'impôt sur revenus fonciers
**Raison :** Architecture données immuable (audit trail légal), moteur orienté règles (FormulaNode/ConditionNode JSONB), TDD
**Périmètre :** 5 tables Supabase, seed CGI LF 2024/2025/2026, 14 étapes calcul IR, 2 régimes (forfaitaire/réel), 6 pages UI
**Résultat :** 23 tests Vitest, build production ✓, 22 pages, mergé dans master
**Par :** Claude Code

---
# 2026-08-30 — Refonte dashboard EasyLocation Immo

- Direction retenue : centre d'actions opérationnel (70 %) + richesse immobilière du portefeuille (30 %).
- Palette : navy, vert émeraude, blanc chaud et corail réservé aux urgences.
- Navigation principale réduite à Dashboard, Biens, Locataires, Contrats et Paiements ; modules secondaires conservés.
- Les montants utilisent les données Supabase quand disponibles et un état de démonstration crédible sinon.
- Les images immobilières sont des actifs dédiés générés pour Marrakech.
- Validation technique : build Next.js réussi, 49 tests passants.
- Validation visuelle : en attente, faute de navigateur disponible dans l'environnement.
