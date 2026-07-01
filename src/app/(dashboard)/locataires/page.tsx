"use client";
import { useEffect, useState } from "react";
import { Locataire, getLocataires, deleteLocataire } from "@/lib/supabase/locataires";
import LocataireCard from "@/components/locataires/LocataireCard";
import LocataireForm from "@/components/locataires/LocataireForm";
import LocatairePreview from "@/components/locataires/LocatairePreview";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

export default function LocatairesPage() {
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Locataire | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Locataire | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setLocataires(await getLocataires()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(l: Locataire) { setEditTarget(l); setPreview(null); setFormOpen(true); }

  async function handleDelete(l: Locataire) {
    if (!confirm(`Supprimer ${l.prenom} ${l.nom} ?`)) return;
    try {
      await deleteLocataire(l.id);
      setPreview(null);
      setLocataires(prev => prev.filter(x => x.id !== l.id));
      setToast({ message: "Locataire supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(l: Locataire) {
    setFormOpen(false);
    setLocataires(prev => {
      const idx = prev.findIndex(x => x.id === l.id);
      return idx >= 0 ? prev.map((x, i) => i === idx ? l : x) : [l, ...prev];
    });
    setToast({ message: editTarget ? "Locataire mis à jour" : "Locataire ajouté", type: "success" });
    setEditTarget(undefined);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Locataires
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {locataires.length} locataire{locataires.length > 1 ? "s" : ""} enregistré{locataires.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Ajouter un locataire
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-36 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : locataires.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Aucun locataire pour l&apos;instant
          </h3>
          <p className="text-slate-400 text-sm mb-6">Ajoutez vos locataires pour gérer vos baux</p>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            + Ajouter un locataire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {locataires.map(l => (
            <LocataireCard key={l.id} locataire={l} onPreview={setPreview} />
          ))}
        </div>
      )}

      <LocatairePreview
        locataire={preview}
        onClose={() => setPreview(null)}
        onEdit={() => preview && handleEdit(preview)}
        onDelete={() => preview && handleDelete(preview)}
      />

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        title={editTarget ? "Modifier le locataire" : "Ajouter un locataire"}
      >
        <LocataireForm
          locataire={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
