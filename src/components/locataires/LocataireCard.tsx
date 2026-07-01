import { Locataire } from "@/lib/supabase/locataires";

type Props = {
  locataire: Locataire;
  onPreview: (l: Locataire) => void;
};

function initials(nom: string, prenom: string) {
  return `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
}

const AVATAR_COLORS = ["#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706"];
function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function LocataireCard({ locataire, onPreview }: Props) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onPreview(locataire)}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: avatarColor(locataire.id) }}
        >
          {initials(locataire.nom, locataire.prenom)}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate" style={{ fontFamily: "Syne, sans-serif" }}>
            {locataire.prenom} {locataire.nom}
          </h3>
          <p className="text-slate-400 text-xs truncate">{locataire.profession || "—"}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {locataire.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>✉️</span><span className="truncate">{locataire.email}</span>
          </div>
        )}
        {locataire.telephone && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>📱</span><span>{locataire.telephone}</span>
          </div>
        )}
        {locataire.revenus_mensuels > 0 && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">Revenus mensuels</span>
            <span className="text-sm font-bold text-slate-800">{locataire.revenus_mensuels.toLocaleString("fr-FR")} €</span>
          </div>
        )}
      </div>
    </div>
  );
}
