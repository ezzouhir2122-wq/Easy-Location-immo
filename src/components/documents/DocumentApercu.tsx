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
    if (!onArchive || !type || !data) return;
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
