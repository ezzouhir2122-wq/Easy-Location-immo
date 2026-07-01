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
      <div
        className="mb-5 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center"
        style={{ minHeight: 220 }}
      >
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
            <p className="text-xs text-slate-400 mb-1">Catégorie</p>
            {cat && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: cat.color, color: cat.text }}
              >
                {cat.label}
              </span>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Taille</p>
            <p className="text-sm font-semibold text-slate-800">{formatFileSize(doc.taille)}</p>
          </div>
          {bienNom && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Bien</p>
              <p className="text-sm font-semibold text-slate-800">{bienNom}</p>
            </div>
          )}
          {locataireNom && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Locataire</p>
              <p className="text-sm font-semibold text-slate-800">{locataireNom}</p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">Ajouté le</p>
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
