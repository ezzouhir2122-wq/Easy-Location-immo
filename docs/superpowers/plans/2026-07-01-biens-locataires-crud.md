# Biens & Locataires CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the Biens and Locataires sidebar sections with full CRUD — list with cards, slide-over form, modal quick-preview, and dedicated detail pages.

**Architecture:** Client components using Supabase browser client (`createClient()`). Data layer functions in `src/lib/supabase/biens.ts` and `locataires.ts`. Shared UI primitives (SlideOver, Modal, StatusBadge, Toast) in `src/components/ui/`. Each module: list page → cards + slide-over form + preview modal → detail page `/[id]`.

**Tech Stack:** Next.js 14 App Router, Supabase JS v2, Tailwind CSS, existing navy palette (#0B1A2F brand, #2563EB blue, #10B981 success, #EF4444 danger, #F59E0B warning), Syne font for headings.

## Global Constraints

- All pages under `src/app/(dashboard)/` — inherits Sidebar layout automatically
- All data components: `"use client"` directive
- Supabase client: `import { createClient } from "@/lib/supabase/client"`
- `owner_id` is set automatically from `supabase.auth.getUser()` — never hardcoded
- RLS is active — queries only return rows owned by the authenticated user
- Color palette: navy `#0B1A2F`, brand `#2563EB`, bg `#F8FAFC`, card bg `white`, border `#E2E8F0`
- No external UI libraries — pure Tailwind + inline styles matching dashboard

---

### Task 1: Data Layer

**Files:**
- Create: `src/lib/supabase/biens.ts`
- Create: `src/lib/supabase/locataires.ts`

**Interfaces Produced:**
```ts
// biens.ts
type Bien = {
  id: string; nom: string; adresse: string; ville: string; code_postal: string;
  type: 'appartement'|'maison'|'studio'|'local_commercial'|'parking'|'autre';
  surface: number; nb_pieces: number; etage: number; loyer_base: number;
  charges: number; depot_garantie: number; dpe: 'A'|'B'|'C'|'D'|'E'|'F'|'G';
  statut: 'libre'|'occupe'|'en_travaux'|'a_vendre';
  description: string; owner_id: string; created_at: string;
}
getBiens(): Promise<Bien[]>
getBien(id: string): Promise<Bien | null>
createBien(data: Omit<Bien, 'id'|'owner_id'|'created_at'>): Promise<Bien>
updateBien(id: string, data: Partial<Bien>): Promise<Bien>
deleteBien(id: string): Promise<void>

// locataires.ts
type Locataire = {
  id: string; nom: string; prenom: string; email: string; telephone: string;
  date_naissance: string; lieu_naissance: string; profession: string;
  revenus_mensuels: number; owner_id: string; created_at: string;
}
getLocataires(): Promise<Locataire[]>
getLocataire(id: string): Promise<Locataire | null>
createLocataire(data: Omit<Locataire, 'id'|'owner_id'|'created_at'>): Promise<Locataire>
updateLocataire(id: string, data: Partial<Locataire>): Promise<Locataire>
deleteLocataire(id: string): Promise<void>
```

- [ ] **Step 1: Create `src/lib/supabase/biens.ts`**

```ts
import { createClient } from "@/lib/supabase/client";

export type Bien = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  type: 'appartement' | 'maison' | 'studio' | 'local_commercial' | 'parking' | 'autre';
  surface: number;
  nb_pieces: number;
  etage: number;
  loyer_base: number;
  charges: number;
  depot_garantie: number;
  dpe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  statut: 'libre' | 'occupe' | 'en_travaux' | 'a_vendre';
  description: string;
  owner_id: string;
  created_at: string;
};

export async function getBiens(): Promise<Bien[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biens")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBien(id: string): Promise<Bien | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biens")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createBien(payload: Omit<Bien, "id" | "owner_id" | "created_at">): Promise<Bien> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("biens")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBien(id: string, payload: Partial<Omit<Bien, "id" | "owner_id" | "created_at">>): Promise<Bien> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biens")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBien(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("biens").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 2: Create `src/lib/supabase/locataires.ts`**

```ts
import { createClient } from "@/lib/supabase/client";

export type Locataire = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  lieu_naissance: string;
  profession: string;
  revenus_mensuels: number;
  owner_id: string;
  created_at: string;
};

export async function getLocataires(): Promise<Locataire[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locataires")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLocataire(id: string): Promise<Locataire | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locataires")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createLocataire(payload: Omit<Locataire, "id" | "owner_id" | "created_at">): Promise<Locataire> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("locataires")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLocataire(id: string, payload: Partial<Omit<Locataire, "id" | "owner_id" | "created_at">>): Promise<Locataire> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locataires")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLocataire(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("locataires").delete().eq("id", id);
  if (error) throw error;
}
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/supabase/biens.ts src/lib/supabase/locataires.ts
git commit -m "feat: data layer for biens and locataires"
```

---

### Task 2: Shared UI Components

**Files:**
- Create: `src/components/ui/SlideOver.tsx`
- Create: `src/components/ui/Modal.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/Toast.tsx`

- [ ] **Step 1: Create `src/components/ui/SlideOver.tsx`**

```tsx
"use client";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function SlideOver({ open, onClose, title, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto"
        style={{ animation: "slideIn 0.2s ease-out" }}
      >
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "#E2E8F0" }}
        >
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Modal.tsx`**

```tsx
"use client";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "fadeUp 0.18s ease-out" }}
      >
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/StatusBadge.tsx`**

```tsx
const BIEN_STATUT: Record<string, { label: string; color: string; bg: string }> = {
  libre:      { label: "Libre",       color: "#10B981", bg: "#D1FAE5" },
  occupe:     { label: "Occupé",      color: "#2563EB", bg: "#DBEAFE" },
  en_travaux: { label: "En travaux",  color: "#F59E0B", bg: "#FEF3C7" },
  a_vendre:   { label: "À vendre",    color: "#EF4444", bg: "#FEE2E2" },
};

export function BienStatusBadge({ statut }: { statut: string }) {
  const s = BIEN_STATUT[statut] ?? { label: statut, color: "#64748B", bg: "#F1F5F9" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

export function DpeBadge({ dpe }: { dpe: string }) {
  const colors: Record<string, string> = {
    A: "#059669", B: "#10B981", C: "#84CC16", D: "#EAB308",
    E: "#F97316", F: "#EF4444", G: "#991B1B",
  };
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold"
      style={{ backgroundColor: colors[dpe] ?? "#94A3B8" }}
    >
      {dpe}
    </span>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/Toast.tsx`**

```tsx
"use client";
import { useEffect } from "react";

type Props = {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
};

export default function Toast({ message, type = "success", onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-white text-sm font-medium"
      style={{
        background: type === "success" ? "#10B981" : "#EF4444",
        animation: "slideUp 0.2s ease-out",
      }}
    >
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/components/ui/
git commit -m "feat: shared UI components — SlideOver, Modal, StatusBadge, Toast"
```

---

### Task 3: Biens List Page

**Files:**
- Create: `src/components/biens/BienCard.tsx`
- Create: `src/components/biens/BienForm.tsx`
- Create: `src/components/biens/BienPreview.tsx`
- Modify: `src/app/(dashboard)/biens/page.tsx`

- [ ] **Step 1: Create `src/components/biens/BienCard.tsx`**

```tsx
import Link from "next/link";
import { Bien } from "@/lib/supabase/biens";
import { BienStatusBadge, DpeBadge } from "@/components/ui/StatusBadge";

type Props = {
  bien: Bien;
  onPreview: (bien: Bien) => void;
};

export default function BienCard({ bien, onPreview }: Props) {
  const typeLabel: Record<string, string> = {
    appartement: "Appartement", maison: "Maison", studio: "Studio",
    local_commercial: "Local commercial", parking: "Parking", autre: "Autre",
  };

  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onPreview(bien)}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "#EFF6FF" }}
        >
          {bien.type === "maison" ? "🏡" : bien.type === "parking" ? "🅿️" : bien.type === "local_commercial" ? "🏢" : "🏠"}
        </div>
        <BienStatusBadge statut={bien.statut} />
      </div>

      <h3 className="font-bold text-slate-800 text-sm mb-0.5 group-hover:text-blue-600 transition-colors" style={{ fontFamily: "Syne, sans-serif" }}>
        {bien.nom}
      </h3>
      <p className="text-slate-400 text-xs mb-3 truncate">{bien.adresse}, {bien.ville}</p>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{typeLabel[bien.type] ?? bien.type} · {bien.surface} m²</span>
        {bien.dpe && <DpeBadge dpe={bien.dpe} />}
      </div>

      {bien.loyer_base > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Loyer de base</span>
          <span className="font-bold text-slate-800 text-sm">{bien.loyer_base.toLocaleString("fr-FR")} €</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/biens/BienForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Bien, createBien, updateBien } from "@/lib/supabase/biens";

type FormData = Omit<Bien, "id" | "owner_id" | "created_at">;

const EMPTY: FormData = {
  nom: "", adresse: "", ville: "", code_postal: "", type: "appartement",
  surface: 0, nb_pieces: 0, etage: 0, loyer_base: 0, charges: 0,
  depot_garantie: 0, dpe: "D", statut: "libre", description: "",
};

type Props = {
  bien?: Bien;
  onSuccess: (bien: Bien) => void;
  onError: (msg: string) => void;
};

export default function BienForm({ bien, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormData>(
    bien ? { nom: bien.nom, adresse: bien.adresse, ville: bien.ville, code_postal: bien.code_postal,
              type: bien.type, surface: bien.surface, nb_pieces: bien.nb_pieces, etage: bien.etage,
              loyer_base: bien.loyer_base, charges: bien.charges, depot_garantie: bien.depot_garantie,
              dpe: bien.dpe, statut: bien.statut, description: bien.description } : EMPTY
  );
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = bien ? await updateBien(bien.id, form) : await createBien(form);
      onSuccess(result);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Nom du bien *</label>
          <input className={inputCls} value={form.nom} onChange={e => set("nom", e.target.value)} required placeholder="Ex: Appt Gambetta T3" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Adresse *</label>
          <input className={inputCls} value={form.adresse} onChange={e => set("adresse", e.target.value)} required placeholder="12 rue des Lilas" />
        </div>
        <div>
          <label className={labelCls}>Ville</label>
          <input className={inputCls} value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Paris" />
        </div>
        <div>
          <label className={labelCls}>Code postal</label>
          <input className={inputCls} value={form.code_postal} onChange={e => set("code_postal", e.target.value)} placeholder="75011" />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value as FormData["type"])}>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="local_commercial">Local commercial</option>
            <option value="parking">Parking</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.statut} onChange={e => set("statut", e.target.value as FormData["statut"])}>
            <option value="libre">Libre</option>
            <option value="occupe">Occupé</option>
            <option value="en_travaux">En travaux</option>
            <option value="a_vendre">À vendre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Surface (m²)</label>
          <input className={inputCls} type="number" value={form.surface || ""} onChange={e => set("surface", parseFloat(e.target.value) || 0)} placeholder="45" />
        </div>
        <div>
          <label className={labelCls}>Pièces</label>
          <input className={inputCls} type="number" value={form.nb_pieces || ""} onChange={e => set("nb_pieces", parseInt(e.target.value) || 0)} placeholder="3" />
        </div>
        <div>
          <label className={labelCls}>Loyer de base (€)</label>
          <input className={inputCls} type="number" value={form.loyer_base || ""} onChange={e => set("loyer_base", parseFloat(e.target.value) || 0)} placeholder="850" />
        </div>
        <div>
          <label className={labelCls}>Charges (€)</label>
          <input className={inputCls} type="number" value={form.charges || ""} onChange={e => set("charges", parseFloat(e.target.value) || 0)} placeholder="80" />
        </div>
        <div>
          <label className={labelCls}>Dépôt de garantie (€)</label>
          <input className={inputCls} type="number" value={form.depot_garantie || ""} onChange={e => set("depot_garantie", parseFloat(e.target.value) || 0)} placeholder="1700" />
        </div>
        <div>
          <label className={labelCls}>DPE</label>
          <select className={inputCls} value={form.dpe} onChange={e => set("dpe", e.target.value as FormData["dpe"])}>
            {["A","B","C","D","E","F","G"].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Informations complémentaires..." />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Enregistrement..." : bien ? "Mettre à jour" : "Ajouter le bien"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `src/components/biens/BienPreview.tsx`**

```tsx
import Link from "next/link";
import { Bien } from "@/lib/supabase/biens";
import { BienStatusBadge, DpeBadge } from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";

type Props = {
  bien: Bien | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function BienPreview({ bien, onClose, onEdit, onDelete }: Props) {
  if (!bien) return null;

  return (
    <Modal open={!!bien} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: "Syne, sans-serif" }}>
              {bien.nom}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">{bien.adresse}, {bien.ville} {bien.code_postal}</p>
          </div>
          <BienStatusBadge statut={bien.statut} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Type", value: bien.type },
            { label: "Surface", value: `${bien.surface} m²` },
            { label: "Pièces", value: bien.nb_pieces },
            { label: "Étage", value: bien.etage },
            { label: "Loyer", value: `${bien.loyer_base?.toLocaleString("fr-FR")} €` },
            { label: "Charges", value: `${bien.charges} €` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
            </div>
          ))}
        </div>

        {bien.dpe && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-slate-400">DPE :</span>
            <DpeBadge dpe={bien.dpe} />
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Link
            href={`/biens/${bien.id}`}
            className="flex-1 py-2 rounded-xl text-center text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            Voir la fiche
          </Link>
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition"
          >
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Replace `src/app/(dashboard)/biens/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Bien, getBiens, deleteBien } from "@/lib/supabase/biens";
import BienCard from "@/components/biens/BienCard";
import BienForm from "@/components/biens/BienForm";
import BienPreview from "@/components/biens/BienPreview";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

export default function BiensPage() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Bien | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bien | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setBiens(await getBiens()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(bien: Bien) { setEditTarget(bien); setPreview(null); setFormOpen(true); }

  async function handleDelete(bien: Bien) {
    if (!confirm(`Supprimer "${bien.nom}" ?`)) return;
    try {
      await deleteBien(bien.id);
      setPreview(null);
      setBiens(b => b.filter(x => x.id !== bien.id));
      setToast({ message: "Bien supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(bien: Bien) {
    setFormOpen(false);
    setBiens(prev => {
      const idx = prev.findIndex(b => b.id === bien.id);
      return idx >= 0 ? prev.map((b, i) => i === idx ? bien : b) : [bien, ...prev];
    });
    setToast({ message: editTarget ? "Bien mis à jour" : "Bien ajouté", type: "success" });
    setEditTarget(undefined);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Biens
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {biens.length} bien{biens.length > 1 ? "s" : ""} dans votre portefeuille
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Ajouter un bien
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-40 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : biens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Aucun bien pour l'instant
          </h3>
          <p className="text-slate-400 text-sm mb-6">Commencez par ajouter votre premier bien immobilier</p>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            + Ajouter un bien
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {biens.map(b => (
            <BienCard key={b.id} bien={b} onPreview={setPreview} />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <BienPreview
        bien={preview}
        onClose={() => setPreview(null)}
        onEdit={() => preview && handleEdit(preview)}
        onDelete={() => preview && handleDelete(preview)}
      />

      {/* SlideOver Form */}
      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        title={editTarget ? "Modifier le bien" : "Ajouter un bien"}
      >
        <BienForm
          bien={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/components/biens/ src/app/(dashboard)/biens/page.tsx
git commit -m "feat: biens list page with cards, slide-over form, preview modal"
```

---

### Task 4: Biens Detail Page

**Files:**
- Create: `src/app/(dashboard)/biens/[id]/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/biens/[id]/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bien, getBien, deleteBien } from "@/lib/supabase/biens";
import { BienStatusBadge, DpeBadge } from "@/components/ui/StatusBadge";
import SlideOver from "@/components/ui/SlideOver";
import BienForm from "@/components/biens/BienForm";
import Toast from "@/components/ui/Toast";

export default function BienDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bien, setBien] = useState<Bien | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getBien(id).then(b => { setBien(b); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!bien || !confirm(`Supprimer "${bien.nom}" ?`)) return;
    try {
      await deleteBien(bien.id);
      router.push("/biens");
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Chargement...</div>;
  if (!bien) return (
    <div className="p-8 text-center">
      <p className="text-slate-500 mb-4">Bien introuvable.</p>
      <Link href="/biens" className="text-blue-600 text-sm underline">← Retour aux biens</Link>
    </div>
  );

  const rows = [
    ["Type", bien.type], ["Surface", `${bien.surface} m²`],
    ["Pièces", bien.nb_pieces], ["Étage", bien.etage],
    ["Ville", bien.ville], ["Code postal", bien.code_postal],
    ["Loyer de base", `${bien.loyer_base?.toLocaleString("fr-FR")} €`],
    ["Charges", `${bien.charges} €`],
    ["Dépôt de garantie", `${bien.depot_garantie?.toLocaleString("fr-FR")} €`],
  ];

  return (
    <div className="p-8 max-w-3xl">
      {/* Breadcrumb */}
      <Link href="/biens" className="text-slate-400 text-xs hover:text-slate-600 transition flex items-center gap-1 mb-6">
        ← Biens
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            {bien.nom}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{bien.adresse}, {bien.ville}</p>
        </div>
        <div className="flex items-center gap-2">
          <BienStatusBadge statut={bien.statut} />
          {bien.dpe && <DpeBadge dpe={bien.dpe} />}
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
          Caractéristiques
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {rows.map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
            </div>
          ))}
        </div>
        {bien.description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Description</p>
            <p className="text-sm text-slate-600">{bien.description}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setFormOpen(true)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          Modifier
        </button>
        <button
          onClick={handleDelete}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition"
        >
          Supprimer
        </button>
      </div>

      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Modifier le bien">
        <BienForm
          bien={bien}
          onSuccess={updated => { setBien(updated); setFormOpen(false); setToast({ message: "Bien mis à jour", type: "success" }); }}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/(dashboard)/biens/
git commit -m "feat: biens detail page /biens/[id]"
```

---

### Task 5: Locataires List Page

**Files:**
- Create: `src/components/locataires/LocataireCard.tsx`
- Create: `src/components/locataires/LocataireForm.tsx`
- Create: `src/components/locataires/LocatairePreview.tsx`
- Modify: `src/app/(dashboard)/locataires/page.tsx`

- [ ] **Step 1: Create `src/components/locataires/LocataireCard.tsx`**

```tsx
import { Locataire } from "@/lib/supabase/locataires";

type Props = {
  locataire: Locataire;
  onPreview: (l: Locataire) => void;
};

function initials(nom: string, prenom: string) {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706"];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function LocataireCard({ locataire, onPreview }: Props) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onPreview(locataire)}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: avatarColor(locataire.id) }}
        >
          {initials(locataire.nom, locataire.prenom)}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate" style={{ fontFamily: "Syne, sans-serif" }}>
            {locataire.prenom} {locataire.nom}
          </h3>
          <p className="text-slate-400 text-xs truncate">{locataire.profession || "—"}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {locataire.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>✉️</span><span className="truncate">{locataire.email}</span>
          </div>
        )}
        {locataire.telephone && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>📱</span><span>{locataire.telephone}</span>
          </div>
        )}
        {locataire.revenus_mensuels > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Revenus mensuels</span>
            <span className="text-sm font-bold text-slate-800">{locataire.revenus_mensuels.toLocaleString("fr-FR")} €</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/locataires/LocataireForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Locataire, createLocataire, updateLocataire } from "@/lib/supabase/locataires";

type FormData = Omit<Locataire, "id" | "owner_id" | "created_at">;

const EMPTY: FormData = {
  nom: "", prenom: "", email: "", telephone: "",
  date_naissance: "", lieu_naissance: "", profession: "", revenus_mensuels: 0,
};

type Props = {
  locataire?: Locataire;
  onSuccess: (l: Locataire) => void;
  onError: (msg: string) => void;
};

export default function LocataireForm({ locataire, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormData>(
    locataire ? {
      nom: locataire.nom, prenom: locataire.prenom, email: locataire.email,
      telephone: locataire.telephone, date_naissance: locataire.date_naissance,
      lieu_naissance: locataire.lieu_naissance, profession: locataire.profession,
      revenus_mensuels: locataire.revenus_mensuels,
    } : EMPTY
  );
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = locataire
        ? await updateLocataire(locataire.id, form)
        : await createLocataire(form);
      onSuccess(result);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Prénom *</label>
          <input className={inputCls} value={form.prenom} onChange={e => set("prenom", e.target.value)} required placeholder="Jean" />
        </div>
        <div>
          <label className={labelCls}>Nom *</label>
          <input className={inputCls} value={form.nom} onChange={e => set("nom", e.target.value)} required placeholder="Dupont" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Email</label>
          <input className={inputCls} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jean.dupont@email.fr" />
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input className={inputCls} value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="06 12 34 56 78" />
        </div>
        <div>
          <label className={labelCls}>Revenus mensuels (€)</label>
          <input className={inputCls} type="number" value={form.revenus_mensuels || ""} onChange={e => set("revenus_mensuels", parseFloat(e.target.value) || 0)} placeholder="2500" />
        </div>
        <div>
          <label className={labelCls}>Date de naissance</label>
          <input className={inputCls} type="date" value={form.date_naissance} onChange={e => set("date_naissance", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Lieu de naissance</label>
          <input className={inputCls} value={form.lieu_naissance} onChange={e => set("lieu_naissance", e.target.value)} placeholder="Paris (75)" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Profession</label>
          <input className={inputCls} value={form.profession} onChange={e => set("profession", e.target.value)} placeholder="Ingénieur" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Enregistrement..." : locataire ? "Mettre à jour" : "Ajouter le locataire"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create `src/components/locataires/LocatairePreview.tsx`**

```tsx
import Link from "next/link";
import { Locataire } from "@/lib/supabase/locataires";
import Modal from "@/components/ui/Modal";

type Props = {
  locataire: Locataire | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function LocatairePreview({ locataire, onClose, onEdit, onDelete }: Props) {
  if (!locataire) return null;

  const age = locataire.date_naissance
    ? Math.floor((Date.now() - new Date(locataire.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <Modal open={!!locataire} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
          >
            {locataire.prenom[0]}{locataire.nom[0]}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: "Syne, sans-serif" }}>
              {locataire.prenom} {locataire.nom}
            </h3>
            <p className="text-slate-400 text-xs">{locataire.profession || "—"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Email", value: locataire.email || "—" },
            { label: "Téléphone", value: locataire.telephone || "—" },
            { label: "Âge", value: age ? `${age} ans` : "—" },
            { label: "Revenus", value: locataire.revenus_mensuels ? `${locataire.revenus_mensuels.toLocaleString("fr-FR")} €/mois` : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Link
            href={`/locataires/${locataire.id}`}
            className="flex-1 py-2 rounded-xl text-center text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            Voir la fiche
          </Link>
          <button
            onClick={onEdit}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition"
          >
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Replace `src/app/(dashboard)/locataires/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { Locataire, getLocataires, deleteLocataire } from "@/lib/supabase/locataires";
import LocataireCard from "@/components/locataires/LocataireCard";
import LocataireForm from "@/components/locataires/LocataireForm";
import LocatairePreview from "@/components/locataires/LocatairePreview";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

export default function LocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Locataire | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Locataire | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setLocataires(await getLocataires()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(l: Locataire) { setEditTarget(l); setPreview(null); setFormOpen(true); }

  async function handleDelete(l: Locataire) {
    if (!confirm(`Supprimer ${l.prenom} ${l.nom} ?`)) return;
    try {
      await deleteLocataire(l.id);
      setPreview(null);
      setLocataires(prev => prev.filter(x => x.id !== l.id));
      setToast({ message: "Locataire supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(l: Locataire) {
    setFormOpen(false);
    setLocataires(prev => {
      const idx = prev.findIndex(x => x.id === l.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? l : x) : [l, ...prev];
    });
    setToast({ message: editTarget ? "Locataire mis à jour" : "Locataire ajouté", type: "success" });
    setEditTarget(undefined);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Locataires
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {locataires.length} locataire{locataires.length > 1 ? "s" : ""} enregistré{locataires.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Ajouter un locataire
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-36 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : locataires.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Aucun locataire pour l'instant
          </h3>
          <p className="text-slate-400 text-sm mb-6">Ajoutez vos locataires pour gérer vos baux</p>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            + Ajouter un locataire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {locataires.map(l => (
            <LocataireCard key={l.id} locataire={l} onPreview={setPreview} />
          ))}
        </div>
      )}

      <LocatairePreview
        locataire={preview}
        onClose={() => setPreview(null)}
        onEdit={() => preview && handleEdit(preview)}
        onDelete={() => preview && handleDelete(preview)}
      />

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        title={editTarget ? "Modifier le locataire" : "Ajouter un locataire"}
      >
        <LocataireForm
          locataire={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/components/locataires/ src/app/(dashboard)/locataires/page.tsx
git commit -m "feat: locataires list page with cards, slide-over form, preview modal"
```

---

### Task 6: Locataires Detail Page

**Files:**
- Create: `src/app/(dashboard)/locataires/[id]/page.tsx`

- [ ] **Step 1: Create `src/app/(dashboard)/locataires/[id]/page.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Locataire, getLocataire, deleteLocataire } from "@/lib/supabase/locataires";
import SlideOver from "@/components/ui/SlideOver";
import LocataireForm from "@/components/locataires/LocataireForm";
import Toast from "@/components/ui/Toast";

export default function LocataireDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [locataire, setLocataire] = useState<Locataire | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getLocataire(id).then(l => { setLocataire(l); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!locataire || !confirm(`Supprimer ${locataire.prenom} ${locataire.nom} ?`)) return;
    try {
      await deleteLocataire(locataire.id);
      router.push("/locataires");
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Chargement...</div>;
  if (!locataire) return (
    <div className="p-8 text-center">
      <p className="text-slate-500 mb-4">Locataire introuvable.</p>
      <Link href="/locataires" className="text-blue-600 text-sm underline">← Retour aux locataires</Link>
    </div>
  );

  const age = locataire.date_naissance
    ? Math.floor((Date.now() - new Date(locataire.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const rows = [
    ["Email", locataire.email || "—"],
    ["Téléphone", locataire.telephone || "—"],
    ["Profession", locataire.profession || "—"],
    ["Revenus mensuels", locataire.revenus_mensuels ? `${locataire.revenus_mensuels.toLocaleString("fr-FR")} €` : "—"],
    ["Date de naissance", locataire.date_naissance ? new Date(locataire.date_naissance).toLocaleDateString("fr-FR") : "—"],
    ["Âge", age ? `${age} ans` : "—"],
    ["Lieu de naissance", locataire.lieu_naissance || "—"],
  ];

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/locataires" className="text-slate-400 text-xs hover:text-slate-600 transition flex items-center gap-1 mb-6">
        ← Locataires
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        >
          {locataire.prenom[0]}{locataire.nom[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            {locataire.prenom} {locataire.nom}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{locataire.profession || "Profession non renseignée"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
          Informations personnelles
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {rows.map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setFormOpen(true)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          Modifier
        </button>
        <button
          onClick={handleDelete}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition"
        >
          Supprimer
        </button>
      </div>

      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Modifier le locataire">
        <LocataireForm
          locataire={locataire}
          onSuccess={updated => { setLocataire(updated); setFormOpen(false); setToast({ message: "Locataire mis à jour", type: "success" }); }}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
```

- [ ] **Step 2: Final commit**
```bash
git add src/app/(dashboard)/locataires/
git commit -m "feat: locataires detail page /locataires/[id]"
```

---

## Summary

| Task | Files | Deliverable |
|------|-------|-------------|
| 1 | `lib/supabase/biens.ts`, `locataires.ts` | CRUD data layer |
| 2 | `components/ui/` (4 files) | Shared UI primitives |
| 3 | `components/biens/` + biens page | Biens list with cards + form + preview |
| 4 | `biens/[id]/page.tsx` | Biens detail page |
| 5 | `components/locataires/` + locataires page | Locataires list with cards + form + preview |
| 6 | `locataires/[id]/page.tsx` | Locataires detail page |
