# Module Documents — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter un module complet de gestion documentaire avec upload Supabase Storage, liaison biens/locataires, aperçu intégré et compteurs réels par catégorie.

**Architecture:** Table `documents` dans Supabase + bucket Storage privé. Librairie CRUD dans `src/lib/supabase/documents.ts`. Page principale avec 6 cartes catégories + liste filtrée. SlideOver upload (`DocumentForm`) + SlideOver aperçu (`DocumentPreview`). Section documents intégrée dans les fiches biens et locataires.

**Tech Stack:** Next.js 14 App Router · TypeScript · Supabase (Postgres + Storage) · Tailwind CSS · shadcn/ui patterns existants

## Global Constraints

- `"use client"` sur tous les composants avec hooks React
- Import Supabase client : `import { createClient } from "@/lib/supabase/client"`
- Police titres : `style={{ fontFamily: "Syne, sans-serif" }}`
- Couleur bouton primaire : `linear-gradient(135deg, #2563EB, #1D4ED8)`
- Devise : DH (pas €)
- Taille max fichier : 50 Mo
- Tous types MIME acceptés
- RLS activée sur toutes les tables — toujours filtrer par `owner_id = auth.uid()`
- Ne jamais committer sur `main` directement

---

## File Map

| Fichier | Action |
|---|---|
| `supabase/migrations/20260701_documents.sql` | Créer |
| `src/lib/supabase/documents.ts` | Créer |
| `src/app/(dashboard)/documents/page.tsx` | Remplacer |
| `src/components/documents/DocumentForm.tsx` | Créer |
| `src/components/documents/DocumentPreview.tsx` | Créer |
| `src/components/documents/DocumentRow.tsx` | Créer |
| `src/app/(dashboard)/biens/[id]/page.tsx` | Modifier |
| `src/app/(dashboard)/locataires/[id]/page.tsx` | Modifier |

---

### Task 1 : Migration SQL + bucket Storage

**Files:**
- Create: `supabase/migrations/20260701_documents.sql`

**Interfaces:**
- Produces: table `public.documents` avec colonnes `id, owner_id, categorie, nom, fichier_url, fichier_type, taille, bien_id, locataire_id, created_at` + bucket `documents`

- [ ] **Step 1 : Créer le fichier de migration**

Créer `supabase/migrations/20260701_documents.sql` avec ce contenu exact :

```sql
-- Migration : Table documents + bucket Storage
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categorie      text NOT NULL CHECK (categorie IN (
                   'contrat_bail','piece_identite','justificatif_revenus',
                   'titre_propriete','assurance','etat_des_lieux')),
  nom            text NOT NULL DEFAULT '',
  fichier_url    text NOT NULL DEFAULT '',
  fichier_type   text NOT NULL DEFAULT '',
  taille         bigint NOT NULL DEFAULT 0,
  bien_id        uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id   uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_own" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
DROP POLICY IF EXISTS "documents_update_own" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;

CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);
```

- [ ] **Step 2 : Exécuter la migration dans Supabase**

Aller dans Supabase Dashboard → SQL Editor → coller et exécuter le contenu du fichier.  
Vérifier : table `documents` apparaît dans Table Editor avec toutes les colonnes.

- [ ] **Step 3 : Créer le bucket Storage**

Dans Supabase Dashboard → Storage → New bucket :
- Name : `documents`
- Public bucket : **OFF** (privé)
- File size limit : `52428800` (50 Mo)

Puis ajouter ces policies Storage dans l'onglet Policies du bucket :

```sql
-- SELECT (download)
CREATE POLICY "storage_documents_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- INSERT (upload)
CREATE POLICY "storage_documents_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- DELETE
CREATE POLICY "storage_documents_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260701_documents.sql
git commit -m "feat: migration table documents + bucket storage"
```

---

### Task 2 : Librairie `documents.ts`

**Files:**
- Create: `src/lib/supabase/documents.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/client`
- Produces:
  - `type Document` — type complet de la table
  - `type CategorieDoc` — union des 6 valeurs catégorie
  - `getDocuments(filters?) → Promise<Document[]>`
  - `createDocument(file: File, meta: DocumentMeta) → Promise<Document>`
  - `deleteDocument(id: string, fichier_url: string) → Promise<void>`
  - `getSignedUrl(fichier_url: string) → Promise<string>`

- [ ] **Step 1 : Créer `src/lib/supabase/documents.ts`**

```typescript
import { createClient } from "@/lib/supabase/client";

export type CategorieDoc =
  | "contrat_bail"
  | "piece_identite"
  | "justificatif_revenus"
  | "titre_propriete"
  | "assurance"
  | "etat_des_lieux";

export type Document = {
  id: string;
  owner_id: string;
  categorie: CategorieDoc;
  nom: string;
  fichier_url: string;
  fichier_type: string;
  taille: number;
  bien_id: string | null;
  locataire_id: string | null;
  created_at: string;
};

export type DocumentMeta = {
  categorie: CategorieDoc;
  nom: string;
  bien_id?: string | null;
  locataire_id?: string | null;
};

export type DocumentFilters = {
  categorie?: CategorieDoc;
  bien_id?: string;
  locataire_id?: string;
};

export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  const supabase = createClient();
  let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (filters?.categorie) query = query.eq("categorie", filters.categorie);
  if (filters?.bien_id) query = query.eq("bien_id", filters.bien_id);
  if (filters?.locataire_id) query = query.eq("locataire_id", filters.locataire_id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createDocument(file: File, meta: DocumentMeta): Promise<Document> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const docId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${docId}/fichier.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: docId,
      owner_id: user.id,
      categorie: meta.categorie,
      nom: meta.nom,
      fichier_url: path,
      fichier_type: file.type,
      taille: file.size,
      bien_id: meta.bien_id ?? null,
      locataire_id: meta.locataire_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string, fichier_url: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("documents").remove([fichier_url]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function getSignedUrl(fichier_url: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(fichier_url, 60);
  if (error) throw error;
  return data.signedUrl;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const CATEGORIES: { value: CategorieDoc; label: string; icon: string; color: string; text: string }[] = [
  { value: "contrat_bail",          label: "Contrats de bail",       icon: "📄", color: "#DBEAFE", text: "#1E40AF" },
  { value: "piece_identite",        label: "Pièces d'identité",      icon: "🪪", color: "#EDE9FE", text: "#5B21B6" },
  { value: "justificatif_revenus",  label: "Justificatifs de revenus", icon: "💼", color: "#D1FAE5", text: "#065F46" },
  { value: "titre_propriete",       label: "Titres de propriété",    icon: "🏠", color: "#FEF3C7", text: "#92400E" },
  { value: "assurance",             label: "Assurances",             icon: "🛡️", color: "#FCE7F3", text: "#9D174D" },
  { value: "etat_des_lieux",        label: "États des lieux",        icon: "📋", color: "#FEE2E2", text: "#991B1B" },
];
```

- [ ] **Step 2 : Commit**

```bash
git add src/lib/supabase/documents.ts
git commit -m "feat: lib documents - CRUD + storage helpers"
```

---

### Task 3 : Composant `DocumentRow`

**Files:**
- Create: `src/components/documents/DocumentRow.tsx`

**Interfaces:**
- Consumes: `Document, formatFileSize, CATEGORIES` from `@/lib/supabase/documents`
- Produces: `<DocumentRow doc={} onPreview={} onDelete={} />` — ligne de tableau

- [ ] **Step 1 : Créer `src/components/documents/DocumentRow.tsx`**

```tsx
"use client";
import { Document, formatFileSize, CATEGORIES } from "@/lib/supabase/documents";

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("word")) return "📝";
  if (type.includes("excel") || type.includes("spreadsheet")) return "📊";
  return "📎";
}

type Props = {
  doc: Document;
  bienNom?: string;
  locataireNom?: string;
  onPreview: () => void;
  onDelete: () => void;
};

export default function DocumentRow({ doc, bienNom, locataireNom, onPreview, onDelete }: Props) {
  const cat = CATEGORIES.find(c => c.value === doc.categorie);
  const date = new Date(doc.created_at).toLocaleDateString("fr-FR");

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{fileIcon(doc.fichier_type)}</span>
          <span className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{doc.nom}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {cat && (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-lg"
            style={{ background: cat.color, color: cat.text }}
          >
            {cat.label}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">{bienNom ?? "—"}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{locataireNom ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{formatFileSize(doc.taille)}</td>
      <td className="px-4 py-3 text-xs text-slate-400">{date}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={onPreview}
            title="Aperçu"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
          >
            👁️
          </button>
          <button
            onClick={onDelete}
            title="Supprimer"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/documents/DocumentRow.tsx
git commit -m "feat: composant DocumentRow"
```

---

### Task 4 : Composant `DocumentForm` (SlideOver upload)

**Files:**
- Create: `src/components/documents/DocumentForm.tsx`

**Interfaces:**
- Consumes:
  - `createDocument, CATEGORIES, DocumentMeta` from `@/lib/supabase/documents`
  - `getBiens` from `@/lib/supabase/biens`
  - `getLocataires` from `@/lib/supabase/locataires`
- Produces: `<DocumentForm onSuccess={(doc) => void} onError={(msg) => void} />`

- [ ] **Step 1 : Vérifier la signature de `getLocataires`**

Ouvrir `src/lib/supabase/locataires.ts` et noter le type `Locataire` (champs `id`, `prenom`, `nom`).

- [ ] **Step 2 : Créer `src/components/documents/DocumentForm.tsx`**

```tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { createDocument, CATEGORIES, DocumentMeta, Document } from "@/lib/supabase/documents";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLocataires, Locataire } from "@/lib/supabase/locataires";

type Props = {
  onSuccess: (doc: Document) => void;
  onError: (msg: string) => void;
};

export default function DocumentForm({ onSuccess, onError }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [nom, setNom] = useState("");
  const [categorie, setCategorie] = useState<DocumentMeta["categorie"] | "">("");
  const [bienId, setBienId] = useState("");
  const [locataireId, setLocataireId] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBiens().then(setBiens).catch(() => {});
    getLocataires().then(setLocataires).catch(() => {});
  }, []);

  function handleFile(f: File) {
    setFile(f);
    if (!nom) setNom(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !categorie) return;
    setLoading(true);
    try {
      const meta: DocumentMeta = {
        categorie: categorie as DocumentMeta["categorie"],
        nom: nom || file.name,
        bien_id: bienId || null,
        locataire_id: locataireId || null,
      };
      const doc = await createDocument(file, meta);
      onSuccess(doc);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Zone drag & drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {file ? (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} Ko</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-3xl">📂</p>
            <p className="text-sm text-slate-500">Glisser un fichier ici ou <span className="text-blue-600 font-medium">parcourir</span></p>
            <p className="text-xs text-slate-400">Tous types — max 50 Mo</p>
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Nom du document *</label>
        <input
          className={inputCls}
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Ex: Contrat bail Dupont 2026"
          required
        />
      </div>

      <div>
        <label className={labelCls}>Catégorie *</label>
        <select
          className={inputCls}
          value={categorie}
          onChange={e => setCategorie(e.target.value as DocumentMeta["categorie"])}
          required
        >
          <option value="">-- Choisir --</option>
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Bien associé (optionnel)</label>
        <select className={inputCls} value={bienId} onChange={e => setBienId(e.target.value)}>
          <option value="">-- Aucun --</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Locataire associé (optionnel)</label>
        <select className={inputCls} value={locataireId} onChange={e => setLocataireId(e.target.value)}>
          <option value="">-- Aucun --</option>
          {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading || !file ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Upload en cours..." : "Enregistrer le document"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/components/documents/DocumentForm.tsx
git commit -m "feat: composant DocumentForm avec drag & drop upload"
```

---

### Task 5 : Composant `DocumentPreview` (SlideOver aperçu)

**Files:**
- Create: `src/components/documents/DocumentPreview.tsx`

**Interfaces:**
- Consumes:
  - `Document, getSignedUrl, formatFileSize, CATEGORIES, deleteDocument` from `@/lib/supabase/documents`
  - `SlideOver` from `@/components/ui/SlideOver`
- Produces: `<DocumentPreview doc={Document|null} onClose={} onDelete={} />`

- [ ] **Step 1 : Créer `src/components/documents/DocumentPreview.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Document, getSignedUrl, formatFileSize, CATEGORIES } from "@/lib/supabase/documents";
import SlideOver from "@/components/ui/SlideOver";

type Props = {
  doc: Document | null;
  bienNom?: string;
  locataireNom?: string;
  onClose: () => void;
  onDelete: (doc: Document) => void;
};

export default function DocumentPreview({ doc, bienNom, locataireNom, onClose, onDelete }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);

  useEffect(() => {
    if (!doc) { setSignedUrl(null); return; }
    setUrlLoading(true);
    getSignedUrl(doc.fichier_url)
      .then(setSignedUrl)
      .catch(() => setSignedUrl(null))
      .finally(() => setUrlLoading(false));
  }, [doc?.id]);

  if (!doc) return null;

  const cat = CATEGORIES.find(c => c.value === doc.categorie);
  const isImage = doc.fichier_type.startsWith("image/");
  const isPdf = doc.fichier_type === "application/pdf";

  function handleDelete() {
    if (!confirm(`Supprimer "${doc!.nom}" ?`)) return;
    onDelete(doc!);
  }

  return (
    <SlideOver open={!!doc} onClose={onClose} title={doc.nom}>
      {/* Aperçu fichier */}
      <div className="mb-5 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center" style={{ minHeight: 220 }}>
        {urlLoading ? (
          <div className="text-slate-400 text-sm">Chargement...</div>
        ) : signedUrl && isImage ? (
          <img src={signedUrl} alt={doc.nom} className="max-h-64 max-w-full object-contain" />
        ) : signedUrl && isPdf ? (
          <iframe src={signedUrl} className="w-full h-64 border-0" title={doc.nom} />
        ) : (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">📎</p>
            <p className="text-sm text-slate-500">Aperçu non disponible</p>
          </div>
        )}
      </div>

      {/* Métadonnées */}
      <div className="space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Catégorie</p>
            {cat && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: cat.color, color: cat.text }}>
                {cat.label}
              </span>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Taille</p>
            <p className="text-sm font-semibold text-slate-800">{formatFileSize(doc.taille)}</p>
          </div>
          {bienNom && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">Bien</p>
              <p className="text-sm font-semibold text-slate-800">{bienNom}</p>
            </div>
          )}
          {locataireNom && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">Locataire</p>
              <p className="text-sm font-semibold text-slate-800">{locataireNom}</p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-0.5">Ajouté le</p>
            <p className="text-sm font-semibold text-slate-800">
              {new Date(doc.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-slate-100">
        {signedUrl && (
          <a
            href={signedUrl}
            download={doc.nom}
            className="flex-1 py-2.5 rounded-xl text-center text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            ⬇ Télécharger
          </a>
        )}
        <button
          onClick={handleDelete}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition"
        >
          Supprimer
        </button>
      </div>
    </SlideOver>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/documents/DocumentPreview.tsx
git commit -m "feat: composant DocumentPreview avec aperçu PDF/image"
```

---

### Task 6 : Page principale `/documents`

**Files:**
- Modify: `src/app/(dashboard)/documents/page.tsx`

**Interfaces:**
- Consumes:
  - `getDocuments, deleteDocument, Document, CATEGORIES` from `@/lib/supabase/documents`
  - `getBiens` from `@/lib/supabase/biens`
  - `getLocataires` from `@/lib/supabase/locataires`
  - `DocumentForm` from `@/components/documents/DocumentForm`
  - `DocumentPreview` from `@/components/documents/DocumentPreview`
  - `DocumentRow` from `@/components/documents/DocumentRow`
  - `SlideOver` from `@/components/ui/SlideOver`
  - `Toast` from `@/components/ui/Toast`

- [ ] **Step 1 : Remplacer `src/app/(dashboard)/documents/page.tsx`**

```tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Document, getDocuments, deleteDocument, CATEGORIES, CategorieDoc
} from "@/lib/supabase/documents";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLocataires, Locataire } from "@/lib/supabase/locataires";
import DocumentForm from "@/components/documents/DocumentForm";
import DocumentPreview from "@/components/documents/DocumentPreview";
import DocumentRow from "@/components/documents/DocumentRow";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<Document | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCat, setFilterCat] = useState<CategorieDoc | "">("");
  const [filterBien, setFilterBien] = useState("");
  const [filterLocataire, setFilterLocataire] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [d, b, l] = await Promise.all([getDocuments(), getBiens(), getLocataires()]);
      setDocs(d);
      setBiens(b);
      setLocataires(l);
    } catch {
      setToast({ message: "Erreur de chargement", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Compteurs par catégorie
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    docs.forEach(d => { map[d.categorie] = (map[d.categorie] ?? 0) + 1; });
    return map;
  }, [docs]);

  // Docs filtrés
  const filtered = useMemo(() => docs.filter(d => {
    if (filterCat && d.categorie !== filterCat) return false;
    if (filterBien && d.bien_id !== filterBien) return false;
    if (filterLocataire && d.locataire_id !== filterLocataire) return false;
    if (searchQuery && !d.nom.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [docs, filterCat, filterBien, filterLocataire, searchQuery]);

  function bienNom(id: string | null) { return biens.find(b => b.id === id)?.nom; }
  function locataireNom(id: string | null) {
    const l = locataires.find(l => l.id === id);
    return l ? `${l.prenom} ${l.nom}` : undefined;
  }

  function handleSuccess(doc: Document) {
    setFormOpen(false);
    setDocs(prev => [doc, ...prev]);
    setToast({ message: "Document ajouté", type: "success" });
  }

  async function handleDelete(doc: Document) {
    try {
      await deleteDocument(doc.id, doc.fichier_url);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      setPreview(null);
      setToast({ message: "Document supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Documents</h1>
          <p className="text-slate-500 text-sm mt-1">Contrats, pièces d&apos;identité, justificatifs</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Ajouter un document
        </button>
      </div>

      {/* Cartes catégories */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {CATEGORIES.map(cat => {
          const count = counts[cat.value] ?? 0;
          const active = filterCat === cat.value;
          return (
            <div
              key={cat.value}
              onClick={() => setFilterCat(active ? "" : cat.value)}
              className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer hover:shadow-md transition-all ${active ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-100"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: cat.color, color: cat.text }}>
                  {count} doc{count > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">{cat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 flex flex-wrap gap-3">
        <input
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Rechercher un document..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterBien}
          onChange={e => setFilterBien(e.target.value)}
        >
          <option value="">Tous les biens</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterLocataire}
          onChange={e => setFilterLocataire(e.target.value)}
        >
          <option value="">Tous les locataires</option>
          {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
        </select>
      </div>

      {/* Tableau documents */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-slate-500 font-medium">Aucun document trouvé</p>
            <p className="text-slate-400 text-sm mt-1">Ajoutez votre premier document via le bouton en haut</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Nom", "Catégorie", "Bien", "Locataire", "Taille", "Date", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  bienNom={bienNom(doc.bien_id)}
                  locataireNom={locataireNom(doc.locataire_id)}
                  onPreview={() => setPreview(doc)}
                  onDelete={() => handleDelete(doc)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SlideOver Upload */}
      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Ajouter un document">
        <DocumentForm
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {/* SlideOver Aperçu */}
      <DocumentPreview
        doc={preview}
        bienNom={preview ? bienNom(preview.bien_id) : undefined}
        locataireNom={preview ? locataireNom(preview.locataire_id) : undefined}
        onClose={() => setPreview(null)}
        onDelete={handleDelete}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier que le build TypeScript passe**

```bash
npx tsc --noEmit
```

Corriger toute erreur de type avant de continuer.

- [ ] **Step 3 : Lancer l'app et tester manuellement**

```bash
npm run dev
```

Ouvrir http://localhost:3000/documents.  
Vérifier : 6 cartes avec compteur 0, bouton "+ Ajouter", tableau vide avec message.

- [ ] **Step 4 : Commit**

```bash
git add src/app/(dashboard)/documents/page.tsx
git commit -m "feat: page documents - cartes catégories + liste filtrée + upload"
```

---

### Task 7 : Section Documents dans `/biens/[id]`

**Files:**
- Modify: `src/app/(dashboard)/biens/[id]/page.tsx`

**Interfaces:**
- Consumes:
  - `getDocuments, Document, deleteDocument, CATEGORIES, formatFileSize` from `@/lib/supabase/documents`
  - `getSignedUrl` from `@/lib/supabase/documents`

- [ ] **Step 1 : Lire le fichier actuel `/biens/[id]/page.tsx`**

Ouvrir `src/app/(dashboard)/biens/[id]/page.tsx` et repérer :
- Le `useEffect` principal de chargement du bien
- La fin du JSX (le dernier `</div>` avant le `return` de fermeture)

- [ ] **Step 2 : Ajouter le state et le chargement des docs**

Dans le composant, après les states existants, ajouter :

```tsx
const [docs, setDocs] = useState<Document[]>([]);

// Dans le useEffect de chargement, ajouter en parallèle :
const [bienData, docsData] = await Promise.all([
  getBien(id),
  getDocuments({ bien_id: id }),
]);
setBien(bienData);
setDocs(docsData);
```

Adapter selon la structure existante du composant — ne pas casser le chargement du bien.

- [ ] **Step 3 : Ajouter la section Documents en fin de JSX**

Juste avant le dernier `</div>` fermant le contenu de la page, insérer :

```tsx
{/* Section Documents */}
<div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
  <h3 className="font-bold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
    Documents ({docs.length})
  </h3>
  {docs.length === 0 ? (
    <p className="text-slate-400 text-sm">Aucun document lié à ce bien.</p>
  ) : (
    <div className="space-y-2">
      {docs.map(doc => {
        const cat = CATEGORIES.find(c => c.value === doc.categorie);
        return (
          <div key={doc.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-lg">{cat?.icon ?? "📎"}</span>
              <div>
                <p className="text-sm font-medium text-slate-800">{doc.nom}</p>
                <p className="text-xs text-slate-400">{cat?.label} · {formatFileSize(doc.taille)}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  const url = await getSignedUrl(doc.fichier_url);
                  window.open(url, "_blank");
                } catch {
                  alert("Erreur lors de l'ouverture");
                }
              }}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Ouvrir
            </button>
          </div>
        );
      })}
    </div>
  )}
</div>
```

- [ ] **Step 4 : Ajouter les imports manquants en tête du fichier**

```tsx
import { getDocuments, deleteDocument, Document, CATEGORIES, formatFileSize, getSignedUrl } from "@/lib/supabase/documents";
import { useState } from "react"; // si pas déjà importé
```

- [ ] **Step 5 : Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 6 : Commit**

```bash
git add src/app/(dashboard)/biens/\[id\]/page.tsx
git commit -m "feat: section documents dans fiche bien"
```

---

### Task 8 : Section Documents dans `/locataires/[id]`

**Files:**
- Modify: `src/app/(dashboard)/locataires/[id]/page.tsx`

**Interfaces:**
- Consumes: même imports que Task 7 (`getDocuments, getSignedUrl, CATEGORIES, formatFileSize`)

- [ ] **Step 1 : Appliquer la même logique que Task 7**

Ouvrir `src/app/(dashboard)/locataires/[id]/page.tsx`.  
Ajouter `const [docs, setDocs] = useState<Document[]>([])`.  
Dans le useEffect, charger en parallèle avec `getDocuments({ locataire_id: id })`.  
Ajouter la même section Documents en fin de JSX (même code exact que Task 7 Step 3).  
Ajouter les mêmes imports.

- [ ] **Step 2 : Vérifier TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3 : Test manuel complet**

```bash
npm run dev
```

Scénario de test :
1. Aller sur `/documents` → 0 doc, 6 cartes avec compteur 0
2. Cliquer "+ Ajouter" → SlideOver s'ouvre
3. Drag & drop un PDF → nom pré-rempli
4. Choisir catégorie "Contrats de bail" + un bien
5. Cliquer "Enregistrer" → doc apparaît dans la liste
6. Carte "Contrats de bail" passe à "1 doc"
7. Cliquer l'œil → SlideOver aperçu s'ouvre avec preview PDF
8. Cliquer "Télécharger" → fichier téléchargé
9. Aller sur la fiche du bien → section Documents avec le doc lié visible
10. Revenir sur Documents → supprimer le doc → compteur revient à 0

- [ ] **Step 4 : Commit**

```bash
git add src/app/(dashboard)/locataires/\[id\]/page.tsx
git commit -m "feat: section documents dans fiche locataire"
```

---

## Self-Review

**Couverture du spec :**
- ✅ Table `documents` + RLS (Task 1)
- ✅ Bucket Storage privé + policies (Task 1)
- ✅ `getDocuments`, `createDocument`, `deleteDocument`, `getSignedUrl` (Task 2)
- ✅ Cartes catégories avec compteurs réels (Task 6)
- ✅ Filtres recherche / bien / locataire (Task 6)
- ✅ Upload drag & drop tous types (Task 4)
- ✅ Aperçu PDF intégré + images (Task 5)
- ✅ Téléchargement signed URL (Task 5)
- ✅ Suppression Storage + DB (Task 2 + Task 5)
- ✅ Section docs dans fiche bien (Task 7)
- ✅ Section docs dans fiche locataire (Task 8)

**Types cohérents :**
- `Document` défini en Task 2, utilisé en Tasks 3/4/5/6/7/8
- `CategorieDoc` défini en Task 2, utilisé en Task 4/6
- `CATEGORIES` défini en Task 2, utilisé en Tasks 3/5/6/7/8
- `DocumentMeta` défini en Task 2, utilisé en Task 4
- `getSignedUrl(fichier_url: string)` uniforme Tasks 5/7/8
- `formatFileSize(bytes: number)` uniforme Tasks 3/7/8
