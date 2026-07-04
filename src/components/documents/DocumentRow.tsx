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
