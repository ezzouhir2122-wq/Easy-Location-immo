# Backlog de Tâches — Easy Location Immo

## Phase 1 — MVP (Priorité Haute)

### Setup
- [ ] `npx create-next-app@latest easy-location-immo --typescript --tailwind --app`
- [ ] Installer shadcn/ui : `npx shadcn@latest init`
- [ ] Créer projet Supabase + configurer `.env`
- [ ] Créer le schéma de base de données (voir ci-dessous)
- [ ] Activer RLS sur toutes les tables

### Schéma DB à Créer
```sql
-- Tables à créer dans Supabase
profiles (id, email, nom, prenom, telephone, created_at)
biens (id, owner_id, nom, adresse, type, surface, nb_pieces, loyer_base, charges, statut, dpe, photos, created_at)
locataires (id, owner_id, nom, prenom, email, telephone, date_naissance, created_at)
contrats (id, bien_id, locataire_id, date_debut, date_fin, loyer, charges, depot_garantie, statut, created_at)
paiements (id, contrat_id, mois, montant, date_paiement, statut, created_at)
documents (id, owner_id, bien_id, locataire_id, type, nom, url, created_at)
```

### Auth
- [ ] Page login/register propriétaire
- [ ] Middleware protection des routes
- [ ] Callback Supabase Auth

### Layout
- [ ] Layout principal avec sidebar navigation
- [ ] Header avec profil utilisateur
- [ ] Navigation : Dashboard / Biens / Locataires / Contrats / Paiements

### Module Biens
- [ ] Page liste des biens avec statut
- [ ] Page fiche bien (détails + locataire actuel)
- [ ] Formulaire ajout/édition bien
- [ ] Upload photos (Supabase Storage)

### Module Locataires
- [ ] Page liste des locataires
- [ ] Page fiche locataire (profil + contrats + paiements)
- [ ] Formulaire ajout/édition locataire
- [ ] Upload documents (pièce d'identité, fiches de paie)

### Module Contrats
- [ ] Formulaire création bail (bien + locataire + dates + montants)
- [ ] Visualisation contrat
- [ ] Génération PDF du bail

### Module Paiements
- [ ] Tableau de bord des loyers du mois
- [ ] Enregistrement d'un paiement
- [ ] Génération quittance PDF
- [ ] Alertes loyers en retard

### Dashboard
- [ ] Taux d'occupation du parc
- [ ] Revenus du mois / annuels
- [ ] Liste des loyers en retard
- [ ] Prochaines échéances de bail

## Phase 2 — Améliorations
- [ ] Signature électronique des baux (Yousign)
- [ ] Paiement en ligne des loyers (Stripe)
- [ ] Notifications email automatiques (Resend)
- [ ] Application mobile (React Native ou PWA)
- [ ] Accès locataire (espace personnel)
- [ ] Encadrement des loyers par zone
- [ ] Import/export Excel

## Bugs Connus
- Aucun pour l'instant
