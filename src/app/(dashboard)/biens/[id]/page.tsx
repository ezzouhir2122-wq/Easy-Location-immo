"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bien, getBien, deleteBien } from "@/lib/supabase/biens";
import { BienStatusBadge, DpeBadge } from "@/components/ui/StatusBadge";
import SlideOver from "@/components/ui/SlideOver";
import BienForm from "@/components/biens/BienForm";
import Toast from "@/components/ui/Toast";

export default function BienDetailPage() {
  const id = (useParams() as { id: string }).id;
  const router = useRouter();
  const [bien, setBien] = useState<Bien | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getBien(id).then(b => { setBien(b); setLoading(false); });
  }, [id]);

  async function handleDelete() {
    if (!bien || !confirm(`Supprimer "${bien.nom}" ?`)) return;
    try {
      await deleteBien(bien.id);
      router.push("/biens");
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  if (loading) return <div className="p-8 text-slate-400 text-sm">Chargement...</div>;
  if (!bien) return (
    <div className="p-8 text-center">
      <p className="text-slate-500 mb-4">Bien introuvable.</p>
      <Link href="/biens" className="text-blue-600 text-sm underline">← Retour aux biens</Link>
    </div>
  );

  const rows: [string, string | number][] = [
    ["Type", bien.type], ["Surface", `${bien.surface} m²`],
    ["Pièces", bien.nb_pieces], ["Étage", bien.etage],
    ["Ville", bien.ville], ["Code postal", bien.code_postal],
    ["Loyer de base", `${bien.loyer_base?.toLocaleString("fr-FR")} DH`],
    ["Charges", `${bien.charges} DH`],
    ["Dépôt de garantie", `${bien.depot_garantie?.toLocaleString("fr-FR")} DH`],
  ];

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/biens" className="text-slate-400 text-xs hover:text-slate-600 transition flex items-center gap-1 mb-6">
        ← Biens
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            {bien.nom}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{bien.adresse}, {bien.ville}</p>
        </div>
        <div className="flex items-center gap-2">
          <BienStatusBadge statut={bien.statut} />
          {bien.dpe && <DpeBadge dpe={bien.dpe} />}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-5">
        <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
          Caractéristiques
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {rows.map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{value}</p>
            </div>
          ))}
        </div>
        {bien.description && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Description</p>
            <p className="text-sm text-slate-600">{bien.description}</p>
          </div>
        )}
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

      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Modifier le bien">
        <BienForm
          bien={bien}
          onSuccess={updated => { setBien(updated); setFormOpen(false); setToast({ message: "Bien mis à jour", type: "success" }); }}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
