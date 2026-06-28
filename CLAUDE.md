# CLAUDE.md — Easy Location Immo

> Fichier de commande principal. Lire en premier à chaque session.

## Contexte Projet
**Type :** app-web
**Stack :** Next.js 14 (App Router) + Supabase + Tailwind CSS + shadcn/ui + Stripe
**Objectif :** Plateforme de gestion de locations immobilières (biens, locataires, loyers, contrats)
**Statut :** Phase 1 — Initialisation

## Commandes Rapides
- `live/state.md` → état de session actuel
- `live/tasks.md` → backlog de tâches
- `decisions/ledger.md` → historique des décisions
- `intel/focus.md` → priorités actuelles

## 8 Règles Essentielles

1. **Périmètre** : l'agent travaille UNIQUEMENT dans le dossier projet, jamais ailleurs sur la machine.
2. **Lister l'existant** : toujours vérifier ce qui existe avant de créer ou modifier quoi que ce soit.
3. **Nommage** : préfixer les fichiers avec leur contexte (ex. `bien_`, `locataire_`, `contrat_`) pour éviter les conflits.
4. **Licences** : n'installer que des bibliothèques sous licence permissive (MIT, Apache 2.0, BSD).
5. **Services autorisés** : utiliser uniquement les prestataires validés (hébergeur UE, emails conformes RGPD, CMP cookies).
6. **Outils externes** : tout outil externe doit être validé par le propriétaire du projet avant usage.
7. **Aucun secret dans le code** : clés d'API et mots de passe UNIQUEMENT via variables d'environnement (.env).
8. **Anti-boucle** : si la même erreur se répète 5 fois → s'arrêter immédiatement et alerter le propriétaire.

## Démarrage de Session
1. Lire `live/state.md`
2. Vérifier `live/tasks.md`
3. Consulter `intel/focus.md`
4. Puis traiter la demande

## Fin de Session
1. Mettre à jour `live/state.md`
2. Logger les décisions dans `decisions/ledger.md`
3. Archiver les fichiers obsolètes dans `archive/`

## Modules Principaux
- **Biens** : liste, fiche, photos, caractéristiques, statut (libre/occupé)
- **Locataires** : profil, documents, historique, scoring
- **Contrats** : baux, durée, conditions, renouvellement, résiliation
- **Paiements** : loyers, charges, quittances, alertes retard
- **Tableau de bord** : KPIs, taux d'occupation, revenus, alertes
