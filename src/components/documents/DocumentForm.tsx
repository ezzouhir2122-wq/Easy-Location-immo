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
