"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  DocumentGenere, DocType,
  getDocumentsGeneres,
} from "@/lib/supabase/documents-generes";
import {
  Document as Doc, CategorieDoc, CATEGORIES,
  getDocuments, createDocument, deleteDocument, getSignedUrl, formatFileSize,
} from "@/lib/supabase/documents";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLocataires, Locataire } from "@/lib/supabase/locataires";
import { getLoyers, Loyer } from "@/lib/supabase/loyers";
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

function printQuittance(q: Loyer) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Quittance de loyer</title>
    <style>body{font-family:Arial,sans-serif;max-width:620px;margin:40px auto;color:#1e293b}h1{font-size:22px;border-bottom:2px solid #2563EB;padding-bottom:8px;margin-bottom:20px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9}.label{color:#64748b;font-size:13px}.value{font-weight:600;font-size:13px}.total{font-size:18px;font-weight:bold;color:#2563EB;margin-top:20px}footer{margin-top:40px;font-size:11px;color:#94a3b8;text-align:center}</style>
    </head><body>
    <h1>Quittance de loyer</h1>
    <div class="row"><span class="label">Bien</span><span class="value">${q.bien_nom ?? "—"}</span></div>
    <div class="row"><span class="label">Locataire</span><span class="value">${q.locataire_nom ?? "—"}</span></div>
    <div class="row"><span class="label">Période</span><span class="value">${new Date(q.date_echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span></div>
    <div class="row"><span class="label">Date de paiement</span><span class="value">${q.date_paiement ? new Date(q.date_paiement).toLocaleDateString("fr-FR") : "—"}</span></div>
    <div class="total">Montant reçu : ${q.montant.toLocaleString("fr-FR")} DH</div>
    <footer>Quittance générée par Easy Location Immo</footer></body></html>`);
  win.document.close();
  win.print();
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<"modeles" | "fichiers">("modeles");

  // — Modèles —
  const [docs, setDocs] = useState<DocumentGenere[]>([]);
  const [quittances, setQuittances] = useState<Loyer[]>([]);
  const [activeType, setActiveType] = useState<DocType | null>(null);
  const [apercu, setApercu] = useState<{ type: DocType; data: Record<string, unknown>; titre: string; isNew: boolean; documentId?: string; bienId?: string | null; locataireId?: string | null } | null>(null);

  // — Fichiers —
  const [fichiers, setFichiers] = useState<Doc[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [filterCat, setFilterCat] = useState<string>("tous");
  const [filterBien, setFilterBien] = useState<string>("tous");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [docsData, loyersData, fichiersData, biensData, locatairesData] = await Promise.all([
        getDocumentsGeneres(), getLoyers(), getDocuments(), getBiens(), getLocataires(),
      ]);
      setDocs(docsData);
      setQuittances(loyersData.filter(l => l.statut === "paye" && l.type === "loyer"));
      setFichiers(fichiersData);
      setBiens(biensData);
      setLocataires(locatairesData);
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : "Erreur de chargement", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    const fd = new FormData(e.target as HTMLFormElement);
    setUploading(true);
    try {
      await createDocument(uploadFile, {
        categorie: fd.get("categorie") as CategorieDoc,
        nom: (fd.get("nom") as string) || uploadFile.name,
        bien_id: (fd.get("bien_id") as string) || null,
        locataire_id: (fd.get("locataire_id") as string) || null,
      });
      setUploadOpen(false);
      setUploadFile(null);
      setToast({ message: "Fichier uploadé avec succès", type: "success" });
      const updated = await getDocuments();
      setFichiers(updated);
    } catch (err: any) {
      setToast({ message: err?.message ?? "Erreur upload", type: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(f: Doc) {
    try {
      const url = await getSignedUrl(f.fichier_url);
      window.open(url, "_blank");
    } catch {
      setToast({ message: "Impossible d'ouvrir le fichier", type: "error" });
    }
  }

  async function handleDeleteFichier(f: Doc) {
    if (!confirm(`Supprimer "${f.nom}" ?`)) return;
    try {
      await deleteDocument(f.id, f.fichier_url);
      setFichiers(prev => prev.filter(x => x.id !== f.id));
      setToast({ message: "Fichier supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  const filteredFichiers = fichiers.filter(f =>
    (filterCat === "tous" || f.categorie === filterCat) &&
    (filterBien === "tous" || f.bien_id === filterBien)
  );

  const catInfo = (cat: string) => CATEGORIES.find(c => c.value === cat);

  return (
    <>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Documents</h1>
            <p className="text-slate-500 text-sm mt-1">Générez des documents et gérez vos fichiers</p>
          </div>
          {tab === "fichiers" && (
            <button
              onClick={() => { setUploadOpen(true); setUploadFile(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              ⬆ Uploader un fichier
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
          {(["modeles", "fichiers"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "modeles" ? "📝 Modèles & Quittances" : `📁 Fichiers (${fichiers.length})`}
            </button>
          ))}
        </div>

        {/* ── TAB MODÈLES ─────────────────────────────────────────────── */}
        {tab === "modeles" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-10">
              {MODELES.map(m => (
                <button key={m.type} onClick={() => setActiveType(m.type)}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-left hover:shadow-md hover:border-blue-200 transition-all group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style={{ background: m.color }}>{m.icon}</div>
                  <p className="font-bold text-slate-800 text-sm mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{m.label}</p>
                  <p className="text-slate-400 text-xs">{m.desc}</p>
                  <div className="mt-4 text-xs font-semibold text-blue-600 group-hover:underline">Créer →</div>
                </button>
              ))}
            </div>

            {/* Quittances */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700" style={{ fontFamily: "Syne, sans-serif" }}>🧾 Quittances de loyer ({quittances.length})</h2>
                <span className="text-xs text-slate-400">Cliquez pour imprimer</span>
              </div>
              {loading ? <div className="p-6 text-center text-slate-400 text-sm">Chargement...</div>
                : quittances.length === 0 ? <div className="p-10 text-center"><p className="text-slate-400 text-sm">Aucune quittance — apparaissent quand un loyer est marqué payé</p></div>
                : (
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-slate-100">
                      {["Bien", "Locataire", "Période", "Payé le", "Montant", ""].map(h => <th key={h} className="text-left text-xs font-semibold text-slate-400 px-5 py-3">{h}</th>)}
                    </tr></thead>
                    <tbody>{quittances.map((q, i) => (
                      <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50 transition" style={{ borderBottom: i === quittances.length - 1 ? "none" : undefined }}>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{q.bien_nom ?? "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600">{q.locataire_nom ?? "—"}</td>
                        <td className="px-5 py-3.5 text-slate-500 capitalize">{new Date(q.date_echeance).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                        <td className="px-5 py-3.5 text-slate-500">{q.date_paiement ? new Date(q.date_paiement).toLocaleDateString("fr-FR") : "—"}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{q.montant.toLocaleString("fr-FR")} DH</td>
                        <td className="px-5 py-3.5 text-right"><button onClick={() => printQuittance(q)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">🖨️ Imprimer</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
            </div>

            {/* Archives */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700" style={{ fontFamily: "Syne, sans-serif" }}>Documents archivés ({docs.length})</h2>
              </div>
              {docs.length === 0 ? (
                <div className="p-12 text-center"><p className="text-4xl mb-3">📂</p><p className="text-slate-500 font-medium">Aucun document archivé</p></div>
              ) : (
                <table className="w-full">
                  <thead><tr className="border-b border-slate-100">{["Type", "Titre", "Date", ""].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400">{h}</th>)}</tr></thead>
                  <tbody>{docs.map(doc => (
                    <tr key={doc.id} className="border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer" onClick={() => setApercu({ type: doc.type, data: doc.data, titre: doc.titre, isNew: false, documentId: doc.id, bienId: doc.bien_id, locataireId: doc.locataire_id })}>
                      <td className="px-5 py-3"><span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">{TYPE_LABEL[doc.type]}</span></td>
                      <td className="px-5 py-3 text-sm font-medium text-slate-800">{doc.titre}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-5 py-3 text-right text-xs text-blue-600 font-medium">Voir →</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── TAB FICHIERS ────────────────────────────────────────────── */}
        {tab === "fichiers" && (
          <>
            {/* Compteurs par catégorie */}
            <div className="grid grid-cols-3 gap-3 mb-5 lg:grid-cols-6">
              {CATEGORIES.map(cat => {
                const count = fichiers.filter(f => f.categorie === cat.value).length;
                return (
                  <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? "tous" : cat.value)}
                    className="rounded-xl border p-3 text-left transition-all"
                    style={{ background: filterCat === cat.value ? cat.color : "#fff", borderColor: filterCat === cat.value ? cat.text : "#e2e8f0" }}>
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: cat.text }}>{cat.label}</p>
                    <p className="text-xs font-bold text-slate-700">{count}</p>
                  </button>
                );
              })}
            </div>

            {/* Filtre bien */}
            <div className="flex items-center gap-3 mb-5">
              <select value={filterBien} onChange={e => setFilterBien(e.target.value)} className="input mt-0 w-auto text-xs py-1.5">
                <option value="tous">Tous les biens</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
              {(filterCat !== "tous" || filterBien !== "tous") && (
                <button onClick={() => { setFilterCat("tous"); setFilterBien("tous"); }} className="text-xs text-slate-400 hover:text-slate-600 underline">
                  Réinitialiser
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400">{filteredFichiers.length} fichier{filteredFichiers.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Liste fichiers */}
            {loading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : filteredFichiers.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <span className="text-4xl mb-3">📁</span>
                <p className="font-semibold text-slate-700">{fichiers.length === 0 ? "Aucun fichier uploadé" : "Aucun fichier pour ces filtres"}</p>
                <p className="text-xs text-slate-400 mt-1 mb-5">{fichiers.length === 0 ? "Uploadez vos baux, CIN, assurances..." : "Modifiez ou réinitialisez les filtres"}</p>
                {fichiers.length === 0 && <button onClick={() => setUploadOpen(true)} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>⬆ Uploader un fichier</button>}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Fichier</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Catégorie</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Bien</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Taille</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Date</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFichiers.map((f, i) => {
                      const cat = catInfo(f.categorie);
                      const bien = biens.find(b => b.id === f.bien_id);
                      return (
                        <tr key={f.id} className="border-b border-slate-50 hover:bg-slate-50 transition" style={{ borderBottom: i === filteredFichiers.length - 1 ? "none" : undefined }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{cat?.icon ?? "📄"}</span>
                              <span className="font-medium text-slate-800 text-xs truncate max-w-[180px]">{f.nom}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {cat && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.color, color: cat.text }}>{cat.label}</span>}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-500">{bien?.nom ?? "—"}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-400">{formatFileSize(f.taille)}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(f.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-3 justify-end">
                              <button onClick={() => handleDownload(f)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">⬇ Ouvrir</button>
                              <button onClick={() => handleDeleteFichier(f)} className="text-xs text-red-400 hover:text-red-600 font-medium">Supprimer</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal upload */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="font-bold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>Uploader un fichier</h2>
              <button onClick={() => setUploadOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <form onSubmit={handleUpload} className="px-6 py-5 space-y-4">
              {/* Drop zone */}
              <div onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
                <span className="text-3xl">{uploadFile ? "📄" : "⬆"}</span>
                <p className="text-sm text-slate-500 font-medium">{uploadFile ? uploadFile.name : "Cliquer pour choisir un fichier"}</p>
                {uploadFile && <p className="text-xs text-slate-400">{formatFileSize(uploadFile.size)}</p>}
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Nom du fichier
                <input name="nom" defaultValue={uploadFile?.name ?? ""} key={uploadFile?.name} className="input mt-0" placeholder="ex. Bail Mohammed Alami 2026" />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                Catégorie *
                <select name="categorie" required className="input mt-0">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                  Bien (optionnel)
                  <select name="bien_id" className="input mt-0">
                    <option value="">— Aucun —</option>
                    {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                  Locataire (optionnel)
                  <select name="locataire_id" className="input mt-0">
                    <option value="">— Aucun —</option>
                    {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
                  </select>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setUploadOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
                <button type="submit" disabled={uploading || !uploadFile} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>
                  {uploading ? "Upload…" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SlideOver générateur */}
      <SlideOver open={activeType !== null} onClose={() => setActiveType(null)} title={activeType ? MODELES.find(m => m.type === activeType)?.label ?? "Document" : ""}>
        {activeType && (
          <DocumentGenerateur type={activeType}
            onPreview={(titre, data, bienId, locataireId) => { setApercu({ type: activeType, data, titre, isNew: true, bienId, locataireId }); setActiveType(null); }}
            onClose={() => setActiveType(null)} />
        )}
      </SlideOver>

      {/* Aperçu */}
      {apercu && (
        <DocumentApercu type={apercu.type} data={apercu.data} titre={apercu.titre} isNew={apercu.isNew} documentId={apercu.documentId} bienId={apercu.bienId} locataireId={apercu.locataireId}
          onArchive={() => { load(); setApercu(null); setToast({ message: "Document archivé", type: "success" }); }}
          onDelete={() => { load(); setApercu(null); setToast({ message: "Document supprimé", type: "success" }); }}
          onModify={() => { const t = apercu.type; setApercu(null); setActiveType(t); }}
          onClose={() => setApercu(null)} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
