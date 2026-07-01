"use client";
import { useEffect, useState } from "react";
import { Bien, getBiens, deleteBien } from "@/lib/supabase/biens";
import BienCard from "@/components/biens/BienCard";
import BienForm from "@/components/biens/BienForm";
import BienPreview from "@/components/biens/BienPreview";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";

export default function BiensPage() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Bien | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bien | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  async function load() {
    setLoading(true);
    try { setBiens(await getBiens()); }
    catch { setToast({ message: "Erreur de chargement", type: "error" }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleAdd() { setEditTarget(undefined); setFormOpen(true); }
  function handleEdit(bien: Bien) { setEditTarget(bien); setPreview(null); setFormOpen(true); }

  async function handleDelete(bien: Bien) {
    if (!confirm(`Supprimer "${bien.nom}" ?`)) return;
    try {
      await deleteBien(bien.id);
      setPreview(null);
      setBiens(b => b.filter(x => x.id !== bien.id));
      setToast({ message: "Bien supprimé", type: "success" });
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" });
    }
  }

  function handleSuccess(bien: Bien) {
    setFormOpen(false);
    setBiens(prev => {
      const idx = prev.findIndex(b => b.id === bien.id);
      return idx >= 0 ? prev.map((b, i) => i === idx ? bien : b) : [bien, ...prev];
    });
    setToast({ message: editTarget ? "Bien mis à jour" : "Bien ajouté", type: "success" });
    setEditTarget(undefined);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Biens
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {biens.length} bien{biens.length > 1 ? "s" : ""} dans votre portefeuille
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          + Ajouter un bien
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-40 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : biens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Aucun bien pour l&apos;instant
          </h3>
          <p className="text-slate-400 text-sm mb-6">Commencez par ajouter votre premier bien immobilier</p>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            + Ajouter un bien
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {biens.map(b => (
            <BienCard key={b.id} bien={b} onPreview={setPreview} />
          ))}
        </div>
      )}

      <BienPreview
        bien={preview}
        onClose={() => setPreview(null)}
        onEdit={() => preview && handleEdit(preview)}
        onDelete={() => preview && handleDelete(preview)}
      />

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        title={editTarget ? "Modifier le bien" : "Ajouter un bien"}
      >
        <BienForm
          bien={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
