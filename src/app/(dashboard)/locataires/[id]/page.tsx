"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Locataire, getLocataire, deleteLocataire } from "@/lib/supabase/locataires";
import SlideOver from "@/components/ui/SlideOver";
import LocataireForm from "@/components/locataires/LocataireForm";
import Toast from "@/components/ui/Toast";

export default function LocataireDetailPage() {
  const id = (useParams() as { id: string }).id;
  const router = useRouter();
  const [locataire, setLocataire] = useState<Locataire | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getLocataire(id).then(l => { setLocataire(l); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!locataire || !confirm(`Supprimer ${locataire.prenom} ${locataire.nom} ?`)) return;
    try {
      await deleteLocataire(locataire.id);
      router.push("/locataires");
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Chargement...</div>;
  if (!locataire) return (
    <div className="p-8 text-center">
      <p className="text-slate-500 mb-4">Locataire introuvable.</p>
      <Link href="/locataires" className="text-blue-600 text-sm underline">← Retour aux locataires</Link>
    </div>
  );

  const age = locataire.date_naissance
    ? Math.floor((Date.now() - new Date(locataire.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  const rows: [string, string][] = [
    ["Email", locataire.email || "—"],
    ["Téléphone", locataire.telephone || "—"],
    ["Profession", locataire.profession || "—"],
    ["Revenus mensuels", locataire.revenus_mensuels ? `${locataire.revenus_mensuels.toLocaleString("fr-FR")} €` : "—"],
    ["Date de naissance", locataire.date_naissance ? new Date(locataire.date_naissance).toLocaleDateString("fr-FR") : "—"],
    ["Âge", age ? `${age} ans` : "—"],
    ["Lieu de naissance", locataire.lieu_naissance || "—"],
  ];

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/locataires" className="text-slate-400 text-xs hover:text-slate-600 transition flex items-center gap-1 mb-6">
        ← Locataires
      </Link>

      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        >
          {locataire.prenom[0]}{locataire.nom[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            {locataire.prenom} {locataire.nom}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{locataire.profession || "Profession non renseignée"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
          Informations personnelles
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {rows.map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setFormOpen(true)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          Modifier
        </button>
        <button
          onClick={handleDelete}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition"
        >
          Supprimer
        </button>
      </div>

      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Modifier le locataire">
        <LocataireForm
          locataire={locataire}
          onSuccess={updated => { setLocataire(updated); setFormOpen(false); setToast({ message: "Locataire mis à jour", type: "success" }); }}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
