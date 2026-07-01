# Spec — Module Documents

**Date :** 2026-07-01  
**Projet :** Easy Location Immo  
**Stack :** Next.js 14 (App Router) + Supabase + Tailwind CSS + shadcn/ui

---

## Objectif

Remplacer la page Documents statique par un module complet de gestion documentaire : upload de fichiers tous types, liaison aux biens et locataires, aperçu intégré, et compteurs réels par catégorie.

---

## Base de données

### Table `documents`

```sql
CREATE TABLE public.documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categorie      text NOT NULL CHECK (categorie IN (
                   'contrat_bail','piece_identite','justificatif_revenus',
                   'titre_propriete','assurance','etat_des_lieux')),
  nom            text NOT NULL,
  fichier_url    text NOT NULL,
  fichier_type   text NOT NULL,
  taille         bigint NOT NULL DEFAULT 0,
  bien_id        uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id   uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

RLS : 4 policies standard (select/insert/update/delete) filtrées sur `auth.uid() = owner_id`.

### Supabase Storage

Bucket `documents` (privé, RLS activée).  
Chemin de stockage : `{owner_id}/{document_id}/{nom_fichier}`  
Taille max par fichier : 50 Mo.  
Tous types MIME acceptés.

---

## Librairie de données (`src/lib/supabase/documents.ts`)

```ts
export type Document = {
  id: string; owner_id: string; categorie: string;
  nom: string; fichier_url: string; fichier_type: string;
  taille: number; bien_id: string | null; locataire_id: string | null;
  created_at: string;
}

export async function getDocuments(filters?: { categorie?: string; bien_id?: string; locataire_id?: string }): Promise<Document[]>
export async function uploadDocument(file: File, meta: Omit<Document, 'id'|'owner_id'|'fichier_url'|'created_at'>): Promise<Document>
export async function deleteDocument(id: string, fichier_url: string): Promise<void>
export async function getDocumentSignedUrl(fichier_url: string): Promise<string>
```

---

## Page principale `/documents`

### Layout

```
[Header : "Documents" + bouton "+ Ajouter"]
[6 cartes catégories — compteurs réels depuis Supabase]
[Barre : Recherche texte | Filtre bien | Filtre locataire | Filtre catégorie]
[Tableau / liste des documents avec colonnes : Nom | Catégorie | Bien | Locataire | Taille | Date | Actions]
```

### Comportement des cartes catégories

Clic sur une carte → applique le filtre catégorie sur la liste en dessous. La carte sélectionnée passe en état actif (border bleue). Re-clic → retire le filtre.

### Tableau de documents

Colonnes : Nom du fichier | Catégorie (badge coloré) | Bien associé | Locataire associé | Taille (formatée Ko/Mo) | Date | Icône type fichier  
Actions par ligne : icône Aperçu + icône Télécharger + icône Supprimer  
Tri par date décroissante par défaut.

---

## Composant `DocumentForm` (SlideOver upload)

Champs :
1. **Fichier** — drag & drop + clic, tous types, max 50 Mo, affiche nom + taille après sélection
2. **Nom** — pré-rempli avec le nom du fichier, modifiable
3. **Catégorie** — select obligatoire (6 options)
4. **Bien** — select optionnel (liste des biens de l'utilisateur)
5. **Locataire** — select optionnel (liste des locataires de l'utilisateur)

Validation : fichier obligatoire, catégorie obligatoire, nom obligatoire.  
À la soumission : upload Storage → insert table → callback `onSuccess(document)`.

---

## Composant `DocumentPreview` (SlideOver aperçu)

Panneau latéral droit (même pattern que `BienPreview`).

| Type fichier | Comportement |
|---|---|
| `image/*` | `<img>` avec objectFit contain, fond gris |
| `application/pdf` | `<iframe>` 100% hauteur |
| Autres | Message "Aperçu non disponible" + bouton Télécharger |

Métadonnées affichées : Nom, Catégorie, Bien lié, Locataire lié, Taille, Date d'upload.  
Actions : Télécharger (signed URL) | Supprimer (avec confirmation).

URL d'aperçu : signed URL Supabase Storage (expiration 60 secondes, régénérée à l'ouverture).

---

## Intégration dans les fiches existantes

### `/biens/[id]`
Ajouter une section "Documents" en bas de la fiche.  
Appel : `getDocuments({ bien_id: id })`  
Affichage : liste compacte (nom + catégorie + date + icône téléchargement).

### `/locataires/[id]`
Même logique avec `locataire_id`.

---

## Migration SQL

Fichier : `supabase/migrations/20260701_documents.sql`  
Contenu : CREATE TABLE + ENABLE RLS + 4 policies.

---

## Fichiers à créer / modifier

| Fichier | Action |
|---|---|
| `supabase/migrations/20260701_documents.sql` | Créer |
| `src/lib/supabase/documents.ts` | Créer |
| `src/app/(dashboard)/documents/page.tsx` | Remplacer |
| `src/components/documents/DocumentForm.tsx` | Créer |
| `src/components/documents/DocumentPreview.tsx` | Créer |
| `src/components/documents/DocumentRow.tsx` | Créer |
| `src/app/(dashboard)/biens/[id]/page.tsx` | Modifier — ajouter section docs |
| `src/app/(dashboard)/locataires/[id]/page.tsx` | Modifier — ajouter section docs |

---

## Hors périmètre (cette itération)

- Versioning de documents
- Signature électronique
- Génération automatique de contrats PDF
- Partage de documents avec locataires
