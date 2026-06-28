# Fiche Projet — Easy Location Immo

**Type :** app-web
**Objectif :** Plateforme de gestion de locations immobilières (biens, locataires, loyers, contrats)
**Créé le :** 2026-06-28
**Statut :** Phase 1 — Initialisation

## Description
Application web complète destinée aux propriétaires bailleurs particuliers et aux petites agences immobilières.
Permet de centraliser la gestion de plusieurs biens, le suivi des locataires, la génération automatique
des contrats de bail et le suivi des paiements de loyers avec alertes automatiques.

## Pour Qui
- **Propriétaires bailleurs particuliers** : 1 à 20 biens, veulent éviter les oublis et automatiser la paperasse
- **Petites agences immobilières** : gestion multi-propriétaires, besoin de reporting
- **Gestionnaires de patrimoine** : vision consolidée de leur parc locatif

## Modules
1. **Dashboard** : KPIs temps réel (taux d'occupation, revenus, alertes)
2. **Biens** : gestion du parc immobilier (adresse, photos, caractéristiques, DPE, statut)
3. **Locataires** : profils, documents, historique, scoring de solvabilité
4. **Contrats** : baux numériques, signature, renouvellement, résiliation
5. **Paiements** : suivi des loyers et charges, quittances PDF, alertes retard
6. **Documents** : stockage sécurisé (factures, états des lieux, DPE, diagnostics)

## Stack Technique
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + PostgreSQL + Storage)
- Stripe (paiements en ligne des loyers)
- Resend (emails transactionnels : quittances, rappels)
- React-PDF (génération de documents)
- Vercel (hébergement)

## Livrables Phase 1
- [ ] Structure du projet initialisée ✅
- [ ] Configuration Next.js + Supabase
- [ ] Schéma base de données (biens, locataires, contrats, paiements)
- [ ] Authentification propriétaire
- [ ] Module Biens (CRUD)
- [ ] Dashboard basique

## Critères de Succès Phase 1
- Un propriétaire peut créer un compte, ajouter ses biens et ses locataires
- Le dashboard affiche les biens et leur statut en temps réel
- L'application est déployée sur Vercel et accessible en ligne
