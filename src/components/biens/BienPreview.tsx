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
