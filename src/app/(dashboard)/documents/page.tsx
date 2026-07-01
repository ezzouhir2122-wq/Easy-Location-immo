"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Document,
  getDocuments,
  deleteDocument,
  CATEGORIES,
  CategorieDoc,
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

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    docs.forEach(d => { map[d.categorie] = (map[d.categorie] ?? 0) + 1; });
    return map;
  }, [docs]);

  const filtered = useMemo(() => docs.filter(d => {
    if (filterCat && d.categorie !== filterCat) return false;
    if (filterBien && d.bien_id !== filterBien) return false;
    if (filterLocataire && d.locataire_id !== filterLocataire) return false;
    if (searchQuery && !d.nom.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [docs, filterCat, filterBien, filterLocataire, searchQuery]);

  function bienNom(id: string | null) {
    return biens.find(b => b.id === id)?.nom;
  }

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
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Documents
          </h1>
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
              className={`bg-white rounded-2xl p-5 shadow-sm border cursor-pointer hover:shadow-md transition-all ${
                active ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{cat.icon}</span>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ background: cat.color, color: cat.text }}
                >
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
            <p className="text-slate-400 text-sm mt-1">
              Ajoutez votre premier document via le bouton en haut
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Nom", "Catégorie", "Bien", "Locataire", "Taille", "Date", ""].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
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

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
