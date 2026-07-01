# Spec — Module Documents Générés
**Date :** 2026-07-01  
**Projet :** Easy Location Immo  
**Stack :** Next.js 14 App Router + Supabase + Tailwind CSS

---

## Contexte

Le module Documents existant était conçu pour uploader des fichiers externes. Ce spec remplace cette approche par la **génération de documents standards** directement dans l'application : l'utilisateur sélectionne un modèle, remplit un formulaire pré-rempli depuis les fiches existantes, prévisualise le document mis en page A4, l'imprime et l'archive.

---

## Documents supportés

### 1. Quittance de loyer
Champs : nom bailleur, nom locataire, adresse du bien, mois concerné, montant loyer HT, montant charges, total TTC, date de paiement, mention légale.

### 2. Contrat de bail
Champs : type de bail (vide / meublé), durée (1 an / 3 ans / autre), date de début, bailleur (nom, adresse, CIN/SIRET), locataire (nom, adresse, CIN, profession), bien (adresse complète, surface, description, équipements si meublé), loyer mensuel, charges, dépôt de garantie, clauses particulières.

### 3. État des lieux
Champs : type (entrée / sortie), date, relevés de compteurs (eau, électricité, gaz), liste des pièces (salon, chambre×N, cuisine, salle de bain, WC, couloir, autres), pour chaque pièce : état murs / sols / plafond / fenêtres / observations, signatures bailleur + locataire.

---

## Architecture

### Nouvelle table Supabase : `documents_generes`
```sql
CREATE TABLE public.documents_generes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('quittance','bail','etat_des_lieux')),
  titre        text NOT NULL,
  data         jsonb NOT NULL,
  bien_id      uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- RLS : owner_id = auth.uid() sur SELECT/INSERT/UPDATE/DELETE
```

Les données du document (tous les champs remplis) sont stockées en JSONB. Le document est **re-rendu côté client** depuis ce JSON à l'ouverture, sans fichier binaire stocké.

### Fichiers à créer

```
src/
  lib/supabase/
    documents-generes.ts          # CRUD table documents_generes
  components/documents/
    templates/
      QuittanceTemplate.tsx       # Rendu HTML A4 quittance
      BailTemplate.tsx            # Rendu HTML A4 contrat de bail
      EtatDesLieuxTemplate.tsx    # Rendu HTML A4 état des lieux
    DocumentGenerateur.tsx        # SlideOver : sélection bien/locataire + formulaire
    DocumentApercu.tsx            # Modal plein écran : aperçu + boutons
  app/(dashboard)/documents/
    page.tsx                      # Redessinée : 3 cartes + liste archives
```

### CSS print global
Dans `globals.css` : règles `@media print` pour masquer sidebar, header, boutons et n'afficher que `.document-print-area`.

---

## Flux utilisateur

```
Page /documents
  ├── 3 cartes cliquables : [Quittance] [Bail] [État des lieux]
  └── Liste des documents archivés (filtrables par type / bien / locataire)

Clic sur une carte
  └── SlideOver DocumentGenerateur
        ├── Sélecteur bien (dropdown)
        ├── Sélecteur locataire (dropdown)
        └── Formulaire pré-rempli (champs éditables)
              └── Bouton "Aperçu"
                    └── Modal DocumentApercu (plein écran)
                          ├── Rendu du template HTML A4
                          ├── Bouton "Imprimer" → window.print()
                          ├── Bouton "Archiver" → INSERT documents_generes
                          └── Bouton "Modifier" → retour formulaire

Clic sur un document archivé
  └── Modal DocumentApercu (re-rendu depuis data JSON)
        ├── Bouton "Imprimer"
        └── Bouton "Supprimer"
```

---

## Templates HTML A4

Chaque template est un composant React qui reçoit les données en props et rend un `<div className="document-print-area">` stylisé :
- Largeur fixe 210mm, padding 20mm, font-family serif
- En-tête : logo/nom de l'app + titre du document
- Corps : sections structurées avec labels et valeurs
- Pied : date, signatures (zones vides à signer à la main)
- `@media print` : `body * { visibility: hidden }`, `.document-print-area * { visibility: visible }`, `position: fixed; top: 0; left: 0`

---

## Comportement des données pré-remplies

1. Sélection bien → pré-remplit : adresse, ville, surface, loyer, charges, dépôt
2. Sélection locataire → pré-remplit : nom, prénom, email, téléphone, profession
3. Bailleur → pré-rempli depuis les paramètres utilisateur (`parametres` page)
4. Tous les champs restent **modifiables** dans le formulaire avant aperçu

---

## Hors périmètre (v1)

- Signature électronique
- Envoi par email
- Numérotation automatique des documents
- Modèles personnalisables par l'utilisateur
- Génération PDF binaire (téléchargement .pdf)
