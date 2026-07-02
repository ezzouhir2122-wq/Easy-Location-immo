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
