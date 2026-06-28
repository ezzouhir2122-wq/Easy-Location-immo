# Easy Location Immo

> Plateforme de gestion de locations immobilières — biens, locataires, contrats, loyers.

## Description
Application web complète pour les propriétaires bailleurs et agences immobilières.
Gérez vos biens, vos locataires, vos contrats de bail et le suivi des paiements depuis une interface unique.

## Fonctionnalités
- **Gestion des biens** : ajout, édition, photos, statut (libre/occupé/en travaux)
- **Gestion des locataires** : profils, documents (pièce d'identité, fiches de paie), scoring de solvabilité
- **Contrats de bail** : création, signature électronique, renouvellement, résiliation
- **Paiements & loyers** : suivi des paiements, génération de quittances PDF, alertes de retard
- **Tableau de bord** : taux d'occupation, revenus mensuels, alertes et notifications
- **Documents** : stockage sécurisé des documents importants

## Stack Technique
- **Frontend** : Next.js 14 (App Router) + TypeScript
- **UI** : Tailwind CSS + shadcn/ui
- **Backend** : Next.js API Routes + Supabase
- **Base de données** : Supabase (PostgreSQL)
- **Auth** : Supabase Auth
- **Paiements** : Stripe
- **Stockage** : Supabase Storage
- **PDF** : React-PDF
- **Hébergement** : Vercel

## Démarrage Rapide
```bash
cp .env.example .env
# Remplir les variables dans .env
npm install
npm run dev
```

## Documentation
- `CLAUDE.md` — Règles et commandes pour l'agent IA
- `SECURITY.md` — Politique de sécurité
- `COMPLIANCE.md` — Conformité RGPD
- `intel/` — Contexte et stack du projet
- `blueprints/` — Workflows et SOPs
- `live/` — État de session et tâches

## Licence
Propriétaire — Easy Location Immo / ANTIGRAVITY
