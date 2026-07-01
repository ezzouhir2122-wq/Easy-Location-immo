# Documents Générés Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le module upload de fichiers par un système de génération de documents standards (quittance, bail, état des lieux) avec formulaire pré-rempli, aperçu A4, impression et archivage.

**Architecture:** Nouvelle table Supabase `documents_generes` stockant les données en JSONB. Templates React rendus en HTML/CSS A4 côté client, impression via `window.print()` avec `@media print`. Page `/documents` redessinée avec 3 cartes + liste archives.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (postgres + RLS), Tailwind CSS, `@media print` CSS natif.

## Global Constraints

- Toutes les valeurs monétaires en DH (dirham marocain)
- Composants "use client" — pas de Server Components pour ce module
- Suivre les patterns existants : `createClient()` depuis `@/lib/supabase/client`, types exportés depuis le lib
- `SlideOver` existant : `src/components/ui/SlideOver.tsx` — utiliser sans modifier
- Pas de nouvelle dépendance npm — uniquement ce qui est déjà installé
- Commit après chaque tâche

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `supabase/migrations/20260701_documents_generes.sql` | Créer — migration SQL |
| `src/lib/supabase/documents-generes.ts` | Créer — CRUD lib |
| `src/app/globals.css` | Modifier — ajouter @media print |
| `src/components/documents/templates/QuittanceTemplate.tsx` | Créer |
| `src/components/documents/templates/BailTemplate.tsx` | Créer |
| `src/components/documents/templates/EtatDesLieuxTemplate.tsx` | Créer |
| `src/components/documents/DocumentApercu.tsx` | Modifier — re-écrire pour doc générés |
| `src/components/documents/DocumentGenerateur.tsx` | Créer — SlideOver formulaire |
| `src/app/(dashboard)/documents/page.tsx` | Modifier — redesign complet |

---

### Task 1: Migration SQL — table `documents_generes`

**Files:**
- Create: `supabase/migrations/20260701_documents_generes.sql`

**Interfaces:**
- Produces: table `documents_generes` avec colonnes `id, owner_id, type, titre, data, bien_id, locataire_id, created_at` et 4 RLS policies

- [ ] **Step 1: Créer le fichier de migration**

Contenu exact de `supabase/migrations/20260701_documents_generes.sql` :

```sql
-- Migration : Table documents_generes
-- Exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.documents_generes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('quittance','bail','etat_des_lieux')),
  titre          text NOT NULL DEFAULT '',
  data           jsonb NOT NULL DEFAULT '{}',
  bien_id        uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id   uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents_generes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docgen_select_own" ON public.documents_generes;
DROP POLICY IF EXISTS "docgen_insert_own" ON public.documents_generes;
DROP POLICY IF EXISTS "docgen_update_own" ON public.documents_generes;
DROP POLICY IF EXISTS "docgen_delete_own" ON public.documents_generes;

CREATE POLICY "docgen_select_own" ON public.documents_generes
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "docgen_insert_own" ON public.documents_generes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "docgen_update_own" ON public.documents_generes
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "docgen_delete_own" ON public.documents_generes
  FOR DELETE USING (auth.uid() = owner_id);
```

- [ ] **Step 2: Exécuter dans Supabase Dashboard**

Ouvrir Supabase Dashboard → SQL Editor → coller le contenu ci-dessus → Run. Vérifier que la table apparaît dans Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260701_documents_generes.sql
git commit -m "feat: migration table documents_generes avec RLS"
```

---

### Task 2: Lib CRUD — `documents-generes.ts`

**Files:**
- Create: `src/lib/supabase/documents-generes.ts`

**Interfaces:**
- Consumes: `createClient` depuis `@/lib/supabase/client`
- Produces:
  - `type DocType = 'quittance' | 'bail' | 'etat_des_lieux'`
  - `type DocumentGenere = { id, owner_id, type: DocType, titre, data: Record<string, unknown>, bien_id, locataire_id, created_at }`
  - `getDocumentsGeneres(): Promise<DocumentGenere[]>`
  - `createDocumentGenere(payload: Omit<DocumentGenere, 'id'|'owner_id'|'created_at'>): Promise<DocumentGenere>`
  - `deleteDocumentGenere(id: string): Promise<void>`

- [ ] **Step 1: Créer le fichier**

Contenu exact de `src/lib/supabase/documents-generes.ts` :

```typescript
import { createClient } from "@/lib/supabase/client";

export type DocType = "quittance" | "bail" | "etat_des_lieux";

export type DocumentGenere = {
  id: string;
  owner_id: string;
  type: DocType;
  titre: string;
  data: Record<string, unknown>;
  bien_id: string | null;
  locataire_id: string | null;
  created_at: string;
};

export async function getDocumentsGeneres(): Promise<DocumentGenere[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents_generes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDocumentGenere(
  payload: Omit<DocumentGenere, "id" | "owner_id" | "created_at">
): Promise<DocumentGenere> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data, error } = await supabase
    .from("documents_generes")
    .insert({ ...payload, owner_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocumentGenere(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents_generes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/documents-generes.ts
git commit -m "feat: lib CRUD documents_generes"
```

---

### Task 3: CSS Print global

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: classe `.document-print-area` qui s'imprime seule en plein écran

- [ ] **Step 1: Ajouter les règles print à la fin de `globals.css`**

Ajouter exactement ceci à la fin du fichier :

```css
@media print {
  body * {
    visibility: hidden;
  }
  .document-print-area,
  .document-print-area * {
    visibility: visible;
  }
  .document-print-area {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
    margin: 0;
    padding: 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: css @media print pour impression documents"
```

---

### Task 4: Template Quittance de loyer

**Files:**
- Create: `src/components/documents/templates/QuittanceTemplate.tsx`

**Interfaces:**
- Consumes: rien
- Produces:
  ```typescript
  export type QuittanceData = {
    bailleur_nom: string;
    bailleur_adresse: string;
    locataire_nom: string;
    locataire_prenom: string;
    bien_adresse: string;
    bien_ville: string;
    mois: string;
    loyer: number;
    charges: number;
    date_paiement: string;
  }
  export default function QuittanceTemplate({ data }: { data: QuittanceData }): JSX.Element
  ```

- [ ] **Step 1: Créer `src/components/documents/templates/QuittanceTemplate.tsx`**

```tsx
export type QuittanceData = {
  bailleur_nom: string;
  bailleur_adresse: string;
  locataire_nom: string;
  locataire_prenom: string;
  bien_adresse: string;
  bien_ville: string;
  mois: string;
  loyer: number;
  charges: number;
  date_paiement: string;
};

export default function QuittanceTemplate({ data }: { data: QuittanceData }) {
  const total = (data.loyer || 0) + (data.charges || 0);

  return (
    <div
      className="document-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        fontFamily: "Georgia, serif",
        fontSize: "12pt",
        lineHeight: 1.6,
        color: "#1a1a1a",
        background: "white",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* En-tête */}
      <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: "8mm", marginBottom: "10mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", fontWeight: "bold", letterSpacing: "2px" }}>
              EASY LOCATION IMMO
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18pt", fontWeight: "bold", letterSpacing: "1px" }}>QUITTANCE DE LOYER</div>
            <div style={{ fontSize: "11pt", marginTop: "2mm" }}>Période : {data.mois || "—"}</div>
          </div>
        </div>
      </div>

      {/* Bailleur */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>
          Bailleur
        </div>
        <div style={{ fontSize: "12pt" }}>{data.bailleur_nom || "—"}</div>
        <div style={{ fontSize: "11pt", color: "#444" }}>{data.bailleur_adresse || "—"}</div>
      </div>

      {/* Locataire */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>
          Locataire
        </div>
        <div style={{ fontSize: "12pt" }}>{data.locataire_prenom || ""} {data.locataire_nom || "—"}</div>
      </div>

      {/* Bien loué */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>
          Bien loué
        </div>
        <div style={{ fontSize: "12pt" }}>{data.bien_adresse || "—"}</div>
        <div style={{ fontSize: "11pt", color: "#444" }}>{data.bien_ville || ""}</div>
      </div>

      {/* Tableau des montants */}
      <div style={{ margin: "10mm 0", border: "1px solid #ddd" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12pt" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "4mm 6mm", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Désignation</th>
              <th style={{ padding: "4mm 6mm", textAlign: "right", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "4mm 6mm", borderBottom: "1px solid #eee" }}>Loyer mensuel</td>
              <td style={{ padding: "4mm 6mm", textAlign: "right", borderBottom: "1px solid #eee" }}>{(data.loyer || 0).toLocaleString("fr-FR")} DH</td>
            </tr>
            <tr>
              <td style={{ padding: "4mm 6mm", borderBottom: "1px solid #eee" }}>Charges</td>
              <td style={{ padding: "4mm 6mm", textAlign: "right", borderBottom: "1px solid #eee" }}>{(data.charges || 0).toLocaleString("fr-FR")} DH</td>
            </tr>
            <tr style={{ fontWeight: "bold", background: "#f9f9f9" }}>
              <td style={{ padding: "4mm 6mm" }}>TOTAL</td>
              <td style={{ padding: "4mm 6mm", textAlign: "right" }}>{total.toLocaleString("fr-FR")} DH</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Déclaration */}
      <div style={{ margin: "10mm 0", padding: "6mm", background: "#f9f9f9", border: "1px solid #eee", fontSize: "11pt" }}>
        Je soussigné(e) <strong>{data.bailleur_nom || "—"}</strong>, bailleur du logement désigné ci-dessus, déclare avoir reçu de{" "}
        <strong>{data.locataire_prenom || ""} {data.locataire_nom || "—"}</strong> la somme de{" "}
        <strong>{total.toLocaleString("fr-FR")} DH</strong> au titre du loyer et des charges du mois de{" "}
        <strong>{data.mois || "—"}</strong>, et lui en donne quittance sous réserve de tous mes droits.
      </div>

      {/* Date paiement */}
      <div style={{ marginBottom: "10mm", fontSize: "11pt" }}>
        <strong>Date de paiement :</strong> {data.date_paiement || "—"}
      </div>

      {/* Signature */}
      <div style={{ marginTop: "20mm", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "70mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Signature du bailleur</div>
          <div style={{ borderBottom: "1px solid #888", width: "60mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>{data.bailleur_nom || ""}</div>
        </div>
      </div>

      {/* Mention légale */}
      <div style={{ marginTop: "15mm", fontSize: "9pt", color: "#888", borderTop: "1px solid #eee", paddingTop: "5mm" }}>
        Cette quittance annule tous les reçus qui auraient pu être établis précédemment en règlement du loyer de la période indiquée. Document généré par Easy Location Immo.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/templates/QuittanceTemplate.tsx
git commit -m "feat: template quittance de loyer A4"
```

---

### Task 5: Template Contrat de Bail

**Files:**
- Create: `src/components/documents/templates/BailTemplate.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export type BailData = {
    type_bail: "vide" | "meuble";
    duree: "1_an" | "3_ans" | "autre";
    duree_autre: string;
    date_debut: string;
    bailleur_nom: string;
    bailleur_adresse: string;
    bailleur_cin: string;
    locataire_nom: string;
    locataire_prenom: string;
    locataire_adresse: string;
    locataire_cin: string;
    locataire_profession: string;
    bien_adresse: string;
    bien_ville: string;
    bien_surface: number;
    bien_description: string;
    loyer: number;
    charges: number;
    depot_garantie: number;
    clauses_particulieres: string;
  }
  export default function BailTemplate({ data }: { data: BailData }): JSX.Element
  ```

- [ ] **Step 1: Créer `src/components/documents/templates/BailTemplate.tsx`**

```tsx
export type BailData = {
  type_bail: "vide" | "meuble";
  duree: "1_an" | "3_ans" | "autre";
  duree_autre: string;
  date_debut: string;
  bailleur_nom: string;
  bailleur_adresse: string;
  bailleur_cin: string;
  locataire_nom: string;
  locataire_prenom: string;
  locataire_adresse: string;
  locataire_cin: string;
  locataire_profession: string;
  bien_adresse: string;
  bien_ville: string;
  bien_surface: number;
  bien_description: string;
  loyer: number;
  charges: number;
  depot_garantie: number;
  clauses_particulieres: string;
};

const DUREE_LABEL: Record<string, string> = {
  "1_an": "1 an",
  "3_ans": "3 ans",
  "autre": "",
};

const s: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: "11pt",
  lineHeight: 1.7,
  color: "#1a1a1a",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "8mm" }}>
      <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #2563EB", paddingBottom: "2mm", marginBottom: "4mm" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", gap: "4mm", marginBottom: "1mm" }}>
      <span style={{ minWidth: "50mm", color: "#555", fontSize: "10pt" }}>{label} :</span>
      <span style={{ fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

export default function BailTemplate({ data }: { data: BailData }) {
  const dureeLabel = data.duree === "autre" ? data.duree_autre : DUREE_LABEL[data.duree] || "—";

  return (
    <div
      className="document-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        background: "white",
        margin: "0 auto",
        boxSizing: "border-box",
        ...s,
      }}
    >
      {/* En-tête */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "8mm", marginBottom: "10mm" }}>
        <div style={{ fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", fontWeight: "bold", letterSpacing: "2px", marginBottom: "3mm" }}>EASY LOCATION IMMO</div>
        <div style={{ fontSize: "18pt", fontWeight: "bold" }}>
          CONTRAT DE BAIL {data.type_bail === "meuble" ? "MEUBLÉ" : "D'HABITATION"}
        </div>
        <div style={{ fontSize: "11pt", marginTop: "2mm", color: "#444" }}>
          Durée : {dureeLabel} — À compter du {data.date_debut || "—"}
        </div>
      </div>

      <Section title="Bailleur">
        <Row label="Nom" value={data.bailleur_nom} />
        <Row label="Adresse" value={data.bailleur_adresse} />
        <Row label="CIN / SIRET" value={data.bailleur_cin} />
      </Section>

      <Section title="Locataire">
        <Row label="Nom" value={`${data.locataire_prenom} ${data.locataire_nom}`} />
        <Row label="Adresse actuelle" value={data.locataire_adresse} />
        <Row label="CIN" value={data.locataire_cin} />
        <Row label="Profession" value={data.locataire_profession} />
      </Section>

      <Section title="Bien loué">
        <Row label="Adresse" value={data.bien_adresse} />
        <Row label="Ville" value={data.bien_ville} />
        <Row label="Surface" value={`${data.bien_surface || 0} m²`} />
        {data.bien_description && <Row label="Description" value={data.bien_description} />}
      </Section>

      <Section title="Conditions financières">
        <Row label="Loyer mensuel" value={`${(data.loyer || 0).toLocaleString("fr-FR")} DH`} />
        <Row label="Charges" value={`${(data.charges || 0).toLocaleString("fr-FR")} DH`} />
        <Row label="Dépôt de garantie" value={`${(data.depot_garantie || 0).toLocaleString("fr-FR")} DH`} />
        <Row label="Total mensuel" value={`${((data.loyer || 0) + (data.charges || 0)).toLocaleString("fr-FR")} DH`} />
      </Section>

      {data.clauses_particulieres && (
        <Section title="Clauses particulières">
          <div style={{ fontSize: "11pt", whiteSpace: "pre-wrap" }}>{data.clauses_particulieres}</div>
        </Section>
      )}

      {/* Signatures */}
      <div style={{ marginTop: "20mm", display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", width: "75mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Le Bailleur</div>
          <div style={{ borderBottom: "1px solid #888", width: "65mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>{data.bailleur_nom || ""}</div>
        </div>
        <div style={{ textAlign: "center", width: "75mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Le Locataire</div>
          <div style={{ borderBottom: "1px solid #888", width: "65mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>
            {data.locataire_prenom || ""} {data.locataire_nom || ""}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "15mm", fontSize: "9pt", color: "#888", borderTop: "1px solid #eee", paddingTop: "5mm" }}>
        Fait en deux exemplaires originaux. Document généré par Easy Location Immo.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/templates/BailTemplate.tsx
git commit -m "feat: template contrat de bail A4"
```

---

### Task 6: Template État des Lieux

**Files:**
- Create: `src/components/documents/templates/EtatDesLieuxTemplate.tsx`

**Interfaces:**
- Produces:
  ```typescript
  export type PieceEtat = {
    nom: string;
    murs: string;
    sols: string;
    plafond: string;
    fenetres: string;
    observations: string;
  }
  export type EtatDesLieuxData = {
    type_edl: "entree" | "sortie";
    date: string;
    bailleur_nom: string;
    locataire_nom: string;
    locataire_prenom: string;
    bien_adresse: string;
    bien_ville: string;
    compteur_eau: string;
    compteur_electricite: string;
    compteur_gaz: string;
    pieces: PieceEtat[];
  }
  export default function EtatDesLieuxTemplate({ data }: { data: EtatDesLieuxData }): JSX.Element
  ```

- [ ] **Step 1: Créer `src/components/documents/templates/EtatDesLieuxTemplate.tsx`**

```tsx
export type PieceEtat = {
  nom: string;
  murs: string;
  sols: string;
  plafond: string;
  fenetres: string;
  observations: string;
};

export type EtatDesLieuxData = {
  type_edl: "entree" | "sortie";
  date: string;
  bailleur_nom: string;
  locataire_nom: string;
  locataire_prenom: string;
  bien_adresse: string;
  bien_ville: string;
  compteur_eau: string;
  compteur_electricite: string;
  compteur_gaz: string;
  pieces: PieceEtat[];
};

export default function EtatDesLieuxTemplate({ data }: { data: EtatDesLieuxData }) {
  return (
    <div
      className="document-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        fontFamily: "Georgia, serif",
        fontSize: "11pt",
        lineHeight: 1.6,
        color: "#1a1a1a",
        background: "white",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* En-tête */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "8mm", marginBottom: "10mm" }}>
        <div style={{ fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", fontWeight: "bold", letterSpacing: "2px", marginBottom: "3mm" }}>EASY LOCATION IMMO</div>
        <div style={{ fontSize: "17pt", fontWeight: "bold" }}>
          ÉTAT DES LIEUX D&apos;{data.type_edl === "entree" ? "ENTRÉE" : "SORTIE"}
        </div>
        <div style={{ fontSize: "11pt", marginTop: "2mm", color: "#444" }}>
          {data.bien_adresse || "—"} — {data.bien_ville || ""}
        </div>
        <div style={{ fontSize: "11pt", marginTop: "1mm", color: "#444" }}>
          Réalisé le : {data.date || "—"}
        </div>
      </div>

      {/* Parties */}
      <div style={{ display: "flex", gap: "8mm", marginBottom: "8mm" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>Bailleur</div>
          <div>{data.bailleur_nom || "—"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>Locataire</div>
          <div>{data.locataire_prenom || ""} {data.locataire_nom || "—"}</div>
        </div>
      </div>

      {/* Compteurs */}
      <div style={{ marginBottom: "8mm", padding: "4mm 6mm", background: "#f9f9f9", border: "1px solid #eee" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>Relevés de compteurs</div>
        <div style={{ display: "flex", gap: "10mm" }}>
          <div><span style={{ color: "#666" }}>Eau : </span><strong>{data.compteur_eau || "—"}</strong></div>
          <div><span style={{ color: "#666" }}>Électricité : </span><strong>{data.compteur_electricite || "—"}</strong></div>
          <div><span style={{ color: "#666" }}>Gaz : </span><strong>{data.compteur_gaz || "—"}</strong></div>
        </div>
      </div>

      {/* Tableau des pièces */}
      {data.pieces && data.pieces.length > 0 && (
        <div style={{ marginBottom: "8mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #2563EB", paddingBottom: "2mm", marginBottom: "4mm" }}>
            État des pièces
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                {["Pièce", "Murs", "Sols", "Plafond", "Fenêtres", "Observations"].map(h => (
                  <th key={h} style={{ padding: "2mm 3mm", border: "1px solid #ddd", textAlign: "left", fontWeight: "bold" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.pieces.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd", fontWeight: "bold" }}>{p.nom || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.murs || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.sols || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.plafond || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.fenetres || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.observations || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <div style={{ marginTop: "15mm", display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", width: "75mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Le Bailleur</div>
          <div style={{ borderBottom: "1px solid #888", width: "65mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>{data.bailleur_nom || ""}</div>
        </div>
        <div style={{ textAlign: "center", width: "75mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Le Locataire</div>
          <div style={{ borderBottom: "1px solid #888", width: "65mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>
            {data.locataire_prenom || ""} {data.locataire_nom || ""}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "10mm", fontSize: "9pt", color: "#888", borderTop: "1px solid #eee", paddingTop: "5mm" }}>
        Fait en deux exemplaires. Document généré par Easy Location Immo.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/templates/EtatDesLieuxTemplate.tsx
git commit -m "feat: template état des lieux A4"
```

---

### Task 7: Composant DocumentApercu (modal aperçu + impression)

**Files:**
- Modify: `src/components/documents/DocumentApercu.tsx` (réécriture complète)

**Interfaces:**
- Consumes:
  - `QuittanceTemplate`, `QuittanceData` depuis `./templates/QuittanceTemplate`
  - `BailTemplate`, `BailData` depuis `./templates/BailTemplate`
  - `EtatDesLieuxTemplate`, `EtatDesLieuxData` depuis `./templates/EtatDesLieuxTemplate`
  - `DocType` depuis `@/lib/supabase/documents-generes`
- Produces:
  ```typescript
  type Props = {
    type: DocType | null;
    data: Record<string, unknown> | null;
    titre: string;
    isNew: boolean;           // true = bouton Archiver, false = bouton Supprimer
    onArchive?: () => void;   // appelé après archivage réussi
    onDelete?: () => void;    // appelé après suppression
    onModify?: () => void;    // retour formulaire
    onClose: () => void;
    bienId?: string | null;
    locataireId?: string | null;
  }
  export default function DocumentApercu(props: Props): JSX.Element | null
  ```

- [ ] **Step 1: Réécrire `src/components/documents/DocumentApercu.tsx`**

```tsx
"use client";
import { useState } from "react";
import { DocType, createDocumentGenere, deleteDocumentGenere } from "@/lib/supabase/documents-generes";
import QuittanceTemplate, { QuittanceData } from "./templates/QuittanceTemplate";
import BailTemplate, { BailData } from "./templates/BailTemplate";
import EtatDesLieuxTemplate, { EtatDesLieuxData } from "./templates/EtatDesLieuxTemplate";

type Props = {
  type: DocType | null;
  data: Record<string, unknown> | null;
  titre: string;
  isNew: boolean;
  documentId?: string;
  onArchive?: () => void;
  onDelete?: () => void;
  onModify?: () => void;
  onClose: () => void;
  bienId?: string | null;
  locataireId?: string | null;
};

export default function DocumentApercu({
  type, data, titre, isNew, documentId,
  onArchive, onDelete, onModify, onClose,
  bienId, locataireId,
}: Props) {
  const [saving, setSaving] = useState(false);

  if (!type || !data) return null;

  function handlePrint() {
    window.print();
  }

  async function handleArchive() {
    if (!onArchive) return;
    setSaving(true);
    try {
      await createDocumentGenere({
        type,
        titre,
        data,
        bien_id: bienId ?? null,
        locataire_id: locataireId ?? null,
      });
      onArchive();
    } catch (err) {
      console.error("Erreur archivage:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!documentId || !onDelete) return;
    try {
      await deleteDocumentGenere(documentId);
      onDelete();
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  }

  function renderTemplate() {
    if (type === "quittance") return <QuittanceTemplate data={data as unknown as QuittanceData} />;
    if (type === "bail") return <BailTemplate data={data as unknown as BailData} />;
    if (type === "etat_des_lieux") return <EtatDesLieuxTemplate data={data as unknown as EtatDesLieuxData} />;
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#1a1a2e" }}>
      {/* Barre d'actions (cachée à l'impression) */}
      <div
        className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: "#0B1A2F", borderBottom: "1px solid #1E3352" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition text-sm flex items-center gap-1"
          >
            ← Fermer
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-white font-semibold text-sm">{titre}</span>
        </div>
        <div className="flex items-center gap-2">
          {onModify && (
            <button
              onClick={onModify}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition"
            >
              Modifier
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            🖨️ Imprimer
          </button>
          {isNew && onArchive && (
            <button
              onClick={handleArchive}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: saving ? "#6B7280" : "linear-gradient(135deg, #10B981, #059669)" }}
            >
              {saving ? "Archivage..." : "✓ Archiver"}
            </button>
          )}
          {!isNew && onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #EF4444, #DC2626)" }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Zone de preview scrollable */}
      <div className="flex-1 overflow-auto py-8 px-4">
        <div style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.5)" }}>
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/DocumentApercu.tsx
git commit -m "feat: DocumentApercu modal impression/archivage"
```

---

### Task 8: Composant DocumentGenerateur (formulaire par type)

**Files:**
- Create: `src/components/documents/DocumentGenerateur.tsx`

**Interfaces:**
- Consumes:
  - `getBiens, Bien` depuis `@/lib/supabase/biens`
  - `getLocataires, Locataire` depuis `@/lib/supabase/locataires`
  - `DocType` depuis `@/lib/supabase/documents-generes`
  - `QuittanceData` depuis `./templates/QuittanceTemplate`
  - `BailData` depuis `./templates/BailTemplate`
  - `EtatDesLieuxData, PieceEtat` depuis `./templates/EtatDesLieuxTemplate`
- Produces:
  ```typescript
  type Props = {
    type: DocType;
    onPreview: (titre: string, data: Record<string, unknown>, bienId: string | null, locataireId: string | null) => void;
    onClose: () => void;
  }
  export default function DocumentGenerateur(props: Props): JSX.Element
  ```

- [ ] **Step 1: Créer `src/components/documents/DocumentGenerateur.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLocataires, Locataire } from "@/lib/supabase/locataires";
import { DocType } from "@/lib/supabase/documents-generes";
import { QuittanceData } from "./templates/QuittanceTemplate";
import { BailData } from "./templates/BailTemplate";
import { EtatDesLieuxData, PieceEtat } from "./templates/EtatDesLieuxTemplate";

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ANNEE_COURANTE = new Date().getFullYear();
const MOIS_OPTIONS = MOIS.flatMap(m => [ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1].map(y => `${m} ${y}`));

const PIECES_DEFAUT: PieceEtat[] = [
  { nom: "Salon", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "Chambre 1", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "Cuisine", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "Salle de bain", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "WC", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
];

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

type Props = {
  type: DocType;
  onPreview: (titre: string, data: Record<string, unknown>, bienId: string | null, locataireId: string | null) => void;
  onClose: () => void;
};

export default function DocumentGenerateur({ type, onPreview, onClose }: Props) {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [selectedBienId, setSelectedBienId] = useState("");
  const [selectedLocataireId, setSelectedLocataireId] = useState("");

  // Quittance state
  const [q, setQ] = useState<QuittanceData>({
    bailleur_nom: "", bailleur_adresse: "",
    locataire_nom: "", locataire_prenom: "",
    bien_adresse: "", bien_ville: "",
    mois: MOIS_OPTIONS[MOIS.indexOf("Janvier") + ANNEE_COURANTE % 3] || MOIS_OPTIONS[0],
    loyer: 0, charges: 0,
    date_paiement: new Date().toLocaleDateString("fr-FR"),
  });

  // Bail state
  const [b, setB] = useState<BailData>({
    type_bail: "vide", duree: "3_ans", duree_autre: "",
    date_debut: "", bailleur_nom: "", bailleur_adresse: "", bailleur_cin: "",
    locataire_nom: "", locataire_prenom: "", locataire_adresse: "",
    locataire_cin: "", locataire_profession: "",
    bien_adresse: "", bien_ville: "", bien_surface: 0, bien_description: "",
    loyer: 0, charges: 0, depot_garantie: 0, clauses_particulieres: "",
  });

  // État des lieux state
  const [e, setE] = useState<EtatDesLieuxData>({
    type_edl: "entree", date: new Date().toLocaleDateString("fr-FR"),
    bailleur_nom: "", locataire_nom: "", locataire_prenom: "",
    bien_adresse: "", bien_ville: "",
    compteur_eau: "", compteur_electricite: "", compteur_gaz: "",
    pieces: PIECES_DEFAUT,
  });

  useEffect(() => {
    getBiens().then(setBiens).catch(() => {});
    getLocataires().then(setLocataires).catch(() => {});
  }, []);

  // Pré-remplissage depuis sélection bien
  useEffect(() => {
    const bien = biens.find(x => x.id === selectedBienId);
    if (!bien) return;
    if (type === "quittance") setQ(prev => ({ ...prev, bien_adresse: bien.adresse, bien_ville: bien.ville, loyer: bien.loyer_base, charges: bien.charges }));
    if (type === "bail") setB(prev => ({ ...prev, bien_adresse: bien.adresse, bien_ville: bien.ville, bien_surface: bien.surface, bien_description: bien.description || "", loyer: bien.loyer_base, charges: bien.charges, depot_garantie: bien.depot_garantie }));
    if (type === "etat_des_lieux") setE(prev => ({ ...prev, bien_adresse: bien.adresse, bien_ville: bien.ville }));
  }, [selectedBienId, biens, type]);

  // Pré-remplissage depuis sélection locataire
  useEffect(() => {
    const loc = locataires.find(x => x.id === selectedLocataireId);
    if (!loc) return;
    if (type === "quittance") setQ(prev => ({ ...prev, locataire_nom: loc.nom, locataire_prenom: loc.prenom }));
    if (type === "bail") setB(prev => ({ ...prev, locataire_nom: loc.nom, locataire_prenom: loc.prenom, locataire_profession: loc.profession || "" }));
    if (type === "etat_des_lieux") setE(prev => ({ ...prev, locataire_nom: loc.nom, locataire_prenom: loc.prenom }));
  }, [selectedLocataireId, locataires, type]);

  function handlePreview() {
    const bienId = selectedBienId || null;
    const locId = selectedLocataireId || null;
    if (type === "quittance") {
      onPreview(`Quittance ${q.mois}`, q as unknown as Record<string, unknown>, bienId, locId);
    } else if (type === "bail") {
      onPreview(`Contrat de bail — ${b.locataire_prenom} ${b.locataire_nom}`, b as unknown as Record<string, unknown>, bienId, locId);
    } else {
      onPreview(`État des lieux ${e.type_edl === "entree" ? "d'entrée" : "de sortie"} — ${e.date}`, e as unknown as Record<string, unknown>, bienId, locId);
    }
  }

  function updatePiece(i: number, field: keyof PieceEtat, value: string) {
    setE(prev => {
      const pieces = [...prev.pieces];
      pieces[i] = { ...pieces[i], [field]: value };
      return { ...prev, pieces };
    });
  }

  const selecteursBienLoc = (
    <div className="space-y-4 pb-4 border-b border-slate-100 mb-4">
      <div>
        <label className={labelCls}>Bien associé</label>
        <select className={inputCls} value={selectedBienId} onChange={e => setSelectedBienId(e.target.value)}>
          <option value="">-- Sélectionner un bien --</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.nom} — {b.adresse}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Locataire associé</label>
        <select className={inputCls} value={selectedLocataireId} onChange={e => setSelectedLocataireId(e.target.value)}>
          <option value="">-- Sélectionner un locataire --</option>
          {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      {selecteursBienLoc}

      {type === "quittance" && (
        <>
          <div><label className={labelCls}>Bailleur — Nom</label><input className={inputCls} value={q.bailleur_nom} onChange={ev => setQ(p => ({ ...p, bailleur_nom: ev.target.value }))} placeholder="Mohamed Alami" /></div>
          <div><label className={labelCls}>Bailleur — Adresse</label><input className={inputCls} value={q.bailleur_adresse} onChange={ev => setQ(p => ({ ...p, bailleur_adresse: ev.target.value }))} placeholder="12 rue des Roses, Casablanca" /></div>
          <div><label className={labelCls}>Locataire — Prénom</label><input className={inputCls} value={q.locataire_prenom} onChange={ev => setQ(p => ({ ...p, locataire_prenom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Locataire — Nom</label><input className={inputCls} value={q.locataire_nom} onChange={ev => setQ(p => ({ ...p, locataire_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse du bien</label><input className={inputCls} value={q.bien_adresse} onChange={ev => setQ(p => ({ ...p, bien_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>Ville</label><input className={inputCls} value={q.bien_ville} onChange={ev => setQ(p => ({ ...p, bien_ville: ev.target.value }))} /></div>
          <div>
            <label className={labelCls}>Mois concerné</label>
            <select className={inputCls} value={q.mois} onChange={ev => setQ(p => ({ ...p, mois: ev.target.value }))}>
              {MOIS_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Loyer (DH)</label><input type="number" className={inputCls} value={q.loyer || ""} onChange={ev => setQ(p => ({ ...p, loyer: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Charges (DH)</label><input type="number" className={inputCls} value={q.charges || ""} onChange={ev => setQ(p => ({ ...p, charges: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Date de paiement</label><input className={inputCls} value={q.date_paiement} onChange={ev => setQ(p => ({ ...p, date_paiement: ev.target.value }))} /></div>
        </>
      )}

      {type === "bail" && (
        <>
          <div>
            <label className={labelCls}>Type de bail</label>
            <select className={inputCls} value={b.type_bail} onChange={ev => setB(p => ({ ...p, type_bail: ev.target.value as "vide" | "meuble" }))}>
              <option value="vide">Bail vide</option>
              <option value="meuble">Bail meublé</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Durée</label>
            <select className={inputCls} value={b.duree} onChange={ev => setB(p => ({ ...p, duree: ev.target.value as BailData["duree"] }))}>
              <option value="1_an">1 an</option>
              <option value="3_ans">3 ans</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          {b.duree === "autre" && <div><label className={labelCls}>Durée précisée</label><input className={inputCls} value={b.duree_autre} onChange={ev => setB(p => ({ ...p, duree_autre: ev.target.value }))} placeholder="Ex: 6 mois" /></div>}
          <div><label className={labelCls}>Date de début</label><input type="date" className={inputCls} value={b.date_debut} onChange={ev => setB(p => ({ ...p, date_debut: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bailleur</p></div>
          <div><label className={labelCls}>Nom</label><input className={inputCls} value={b.bailleur_nom} onChange={ev => setB(p => ({ ...p, bailleur_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse</label><input className={inputCls} value={b.bailleur_adresse} onChange={ev => setB(p => ({ ...p, bailleur_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>CIN / SIRET</label><input className={inputCls} value={b.bailleur_cin} onChange={ev => setB(p => ({ ...p, bailleur_cin: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Locataire</p></div>
          <div><label className={labelCls}>Prénom</label><input className={inputCls} value={b.locataire_prenom} onChange={ev => setB(p => ({ ...p, locataire_prenom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Nom</label><input className={inputCls} value={b.locataire_nom} onChange={ev => setB(p => ({ ...p, locataire_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse actuelle</label><input className={inputCls} value={b.locataire_adresse} onChange={ev => setB(p => ({ ...p, locataire_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>CIN</label><input className={inputCls} value={b.locataire_cin} onChange={ev => setB(p => ({ ...p, locataire_cin: ev.target.value }))} /></div>
          <div><label className={labelCls}>Profession</label><input className={inputCls} value={b.locataire_profession} onChange={ev => setB(p => ({ ...p, locataire_profession: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bien loué</p></div>
          <div><label className={labelCls}>Adresse</label><input className={inputCls} value={b.bien_adresse} onChange={ev => setB(p => ({ ...p, bien_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>Ville</label><input className={inputCls} value={b.bien_ville} onChange={ev => setB(p => ({ ...p, bien_ville: ev.target.value }))} /></div>
          <div><label className={labelCls}>Surface (m²)</label><input type="number" className={inputCls} value={b.bien_surface || ""} onChange={ev => setB(p => ({ ...p, bien_surface: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={b.bien_description} onChange={ev => setB(p => ({ ...p, bien_description: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Finances</p></div>
          <div><label className={labelCls}>Loyer mensuel (DH)</label><input type="number" className={inputCls} value={b.loyer || ""} onChange={ev => setB(p => ({ ...p, loyer: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Charges (DH)</label><input type="number" className={inputCls} value={b.charges || ""} onChange={ev => setB(p => ({ ...p, charges: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Dépôt de garantie (DH)</label><input type="number" className={inputCls} value={b.depot_garantie || ""} onChange={ev => setB(p => ({ ...p, depot_garantie: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Clauses particulières</label><textarea className={inputCls} rows={4} value={b.clauses_particulieres} onChange={ev => setB(p => ({ ...p, clauses_particulieres: ev.target.value }))} placeholder="Laisser vide si aucune" /></div>
        </>
      )}

      {type === "etat_des_lieux" && (
        <>
          <div>
            <label className={labelCls}>Type d&apos;état des lieux</label>
            <select className={inputCls} value={e.type_edl} onChange={ev => setE(p => ({ ...p, type_edl: ev.target.value as "entree" | "sortie" }))}>
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
            </select>
          </div>
          <div><label className={labelCls}>Date</label><input className={inputCls} value={e.date} onChange={ev => setE(p => ({ ...p, date: ev.target.value }))} /></div>
          <div><label className={labelCls}>Bailleur — Nom</label><input className={inputCls} value={e.bailleur_nom} onChange={ev => setE(p => ({ ...p, bailleur_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Locataire — Prénom</label><input className={inputCls} value={e.locataire_prenom} onChange={ev => setE(p => ({ ...p, locataire_prenom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Locataire — Nom</label><input className={inputCls} value={e.locataire_nom} onChange={ev => setE(p => ({ ...p, locataire_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse du bien</label><input className={inputCls} value={e.bien_adresse} onChange={ev => setE(p => ({ ...p, bien_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>Ville</label><input className={inputCls} value={e.bien_ville} onChange={ev => setE(p => ({ ...p, bien_ville: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Compteurs</p></div>
          <div><label className={labelCls}>Eau</label><input className={inputCls} value={e.compteur_eau} onChange={ev => setE(p => ({ ...p, compteur_eau: ev.target.value }))} placeholder="Ex: 1234.5 m³" /></div>
          <div><label className={labelCls}>Électricité</label><input className={inputCls} value={e.compteur_electricite} onChange={ev => setE(p => ({ ...p, compteur_electricite: ev.target.value }))} placeholder="Ex: 5678 kWh" /></div>
          <div><label className={labelCls}>Gaz</label><input className={inputCls} value={e.compteur_gaz} onChange={ev => setE(p => ({ ...p, compteur_gaz: ev.target.value }))} placeholder="Ex: 234 m³ ou N/A" /></div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pièces</p>
              <button
                type="button"
                onClick={() => setE(p => ({ ...p, pieces: [...p.pieces, { nom: "", murs: "", sols: "", plafond: "", fenetres: "", observations: "" }] }))}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Ajouter une pièce
              </button>
            </div>
            {e.pieces.map((piece, i) => (
              <div key={i} className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <input
                    className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-sm font-medium"
                    value={piece.nom}
                    onChange={ev => updatePiece(i, "nom", ev.target.value)}
                    placeholder="Nom de la pièce"
                  />
                  <button
                    type="button"
                    onClick={() => setE(p => ({ ...p, pieces: p.pieces.filter((_, j) => j !== i) }))}
                    className="ml-2 text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["murs", "sols", "plafond", "fenetres"] as const).map(f => (
                    <div key={f}>
                      <label className="block text-xs text-slate-500 mb-0.5 capitalize">{f}</label>
                      <select
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs"
                        value={piece[f]}
                        onChange={ev => updatePiece(i, f, ev.target.value)}
                      >
                        <option value="">--</option>
                        <option value="Bon état">Bon état</option>
                        <option value="État moyen">État moyen</option>
                        <option value="Mauvais état">Mauvais état</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-slate-500 mb-0.5">Observations</label>
                  <input className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs" value={piece.observations} onChange={ev => updatePiece(i, "observations", ev.target.value)} placeholder="Optionnel" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bouton aperçu fixé en bas */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100" style={{ maxWidth: "512px", marginLeft: "auto" }}>
        <button
          onClick={handlePreview}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          Aperçu du document →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/documents/DocumentGenerateur.tsx
git commit -m "feat: composant DocumentGenerateur formulaire pré-rempli"
```

---

### Task 9: Page /documents — redesign complet

**Files:**
- Modify: `src/app/(dashboard)/documents/page.tsx` (réécriture complète)

**Interfaces:**
- Consumes:
  - `DocumentGenere, DocType, getDocumentsGeneres` depuis `@/lib/supabase/documents-generes`
  - `DocumentGenerateur` depuis `@/components/documents/DocumentGenerateur`
  - `DocumentApercu` depuis `@/components/documents/DocumentApercu`
  - `SlideOver` depuis `@/components/ui/SlideOver`
  - `Toast` depuis `@/components/ui/Toast`

- [ ] **Step 1: Réécrire `src/app/(dashboard)/documents/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import {
  DocumentGenere, DocType,
  getDocumentsGeneres,
} from "@/lib/supabase/documents-generes";
import DocumentGenerateur from "@/components/documents/DocumentGenerateur";
import DocumentApercu from "@/components/documents/DocumentApercu";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

const MODELES: { type: DocType; icon: string; label: string; desc: string; color: string }[] = [
  { type: "quittance", icon: "🧾", label: "Quittance de loyer", desc: "Attestation de paiement mensuel", color: "#DBEAFE" },
  { type: "bail", icon: "📋", label: "Contrat de bail", desc: "Vide ou meublé, 1 ou 3 ans", color: "#D1FAE5" },
  { type: "etat_des_lieux", icon: "🏠", label: "État des lieux", desc: "Entrée ou sortie avec checklist", color: "#FEF3C7" },
];

const TYPE_LABEL: Record<DocType, string> = {
  quittance: "Quittance",
  bail: "Contrat de bail",
  etat_des_lieux: "État des lieux",
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentGenere[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // SlideOver générateur
  const [activeType, setActiveType] = useState<DocType | null>(null);

  // Aperçu
  const [apercu, setApercu] = useState<{
    type: DocType;
    data: Record<string, unknown>;
    titre: string;
    isNew: boolean;
    documentId?: string;
    bienId?: string | null;
    locataireId?: string | null;
  } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      setDocs(await getDocumentsGeneres());
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openGenerateur(type: DocType) {
    setActiveType(type);
  }

  function handlePreview(
    titre: string,
    data: Record<string, unknown>,
    bienId: string | null,
    locataireId: string | null
  ) {
    if (!activeType) return;
    setApercu({ type: activeType, data, titre, isNew: true, bienId, locataireId });
    setActiveType(null);
  }

  function handleArchive() {
    load();
    setApercu(null);
    setToast({ message: "Document archivé avec succès", type: "success" });
  }

  function handleDelete() {
    load();
    setApercu(null);
    setToast({ message: "Document supprimé", type: "success" });
  }

  function openArchive(doc: DocumentGenere) {
    setApercu({
      type: doc.type,
      data: doc.data,
      titre: doc.titre,
      isNew: false,
      documentId: doc.id,
      bienId: doc.bien_id,
      locataireId: doc.locataire_id,
    });
  }

  return (
    <>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Documents
          </h1>
          <p className="text-slate-500 text-sm mt-1">Générez, imprimez et archivez vos documents locatifs</p>
        </div>

        {/* 3 cartes modèles */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {MODELES.map(m => (
            <button
              key={m.type}
              onClick={() => openGenerateur(m.type)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-left hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: m.color }}
              >
                {m.icon}
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
                {m.label}
              </p>
              <p className="text-slate-400 text-xs">{m.desc}</p>
              <div className="mt-4 text-xs font-semibold text-blue-600 group-hover:underline">
                Créer →
              </div>
            </button>
          ))}
        </div>

        {/* Erreur de chargement */}
        {loadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
            <p className="font-semibold mb-1">Erreur de chargement</p>
            <p className="font-mono text-xs opacity-80">{loadError}</p>
          </div>
        )}

        {/* Archives */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700" style={{ fontFamily: "Syne, sans-serif" }}>
              Documents archivés ({docs.length})
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
          ) : docs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">📂</p>
              <p className="text-slate-500 font-medium">Aucun document archivé</p>
              <p className="text-slate-400 text-sm mt-1">Créez votre premier document via les cartes ci-dessus</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Type", "Titre", "Date", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => openArchive(doc)}
                  >
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
                        {TYPE_LABEL[doc.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-800">{doc.titre}</td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-blue-600 font-medium hover:underline">Voir →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* SlideOver formulaire */}
      <SlideOver
        open={activeType !== null}
        onClose={() => setActiveType(null)}
        title={activeType ? MODELES.find(m => m.type === activeType)?.label ?? "Document" : ""}
      >
        {activeType && (
          <DocumentGenerateur
            type={activeType}
            onPreview={handlePreview}
            onClose={() => setActiveType(null)}
          />
        )}
      </SlideOver>

      {/* Aperçu plein écran */}
      {apercu && (
        <DocumentApercu
          type={apercu.type}
          data={apercu.data}
          titre={apercu.titre}
          isNew={apercu.isNew}
          documentId={apercu.documentId}
          bienId={apercu.bienId}
          locataireId={apercu.locataireId}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onModify={() => {
            const type = apercu.type;
            setApercu(null);
            setActiveType(type);
          }}
          onClose={() => setApercu(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/documents/page.tsx
git commit -m "feat: page documents redessinée — 3 modèles + archives"
```

---

## Checklist de recette finale

- [ ] La page `/documents` affiche 3 cartes cliquables
- [ ] Clic sur une carte → SlideOver avec formulaire
- [ ] Sélectionner un bien → champs pré-remplis (adresse, loyer, charges)
- [ ] Sélectionner un locataire → nom/prénom pré-remplis
- [ ] Bouton "Aperçu" → modal plein écran avec document A4
- [ ] Bouton "Imprimer" → dialog impression navigateur, seul le document s'imprime (sidebar cachée)
- [ ] Bouton "Archiver" → document sauvegardé, apparaît dans la liste
- [ ] Clic sur document archivé → re-rendu du document
- [ ] Bouton "Supprimer" sur document archivé → suppression de la liste
