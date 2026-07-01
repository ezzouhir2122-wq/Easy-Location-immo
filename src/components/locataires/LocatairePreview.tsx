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
