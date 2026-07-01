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
          <span className="font-bold text-slate-800 text-sm">{bien.loyer_base.toLocaleString("fr-FR")} DH</span>
        </div>
      )}
    </div>
  );
}
