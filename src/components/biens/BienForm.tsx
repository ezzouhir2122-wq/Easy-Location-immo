"use client";
import { useState } from "react";
import { Bien, createBien, updateBien } from "@/lib/supabase/biens";

type FormData = Omit<Bien, "id" | "owner_id" | "created_at">;

const EMPTY: FormData = {
  nom: "", adresse: "", ville: "", code_postal: "", type: "appartement",
  surface: 0, nb_pieces: 0, etage: 0, loyer_base: 0, charges: 0,
  depot_garantie: 0, dpe: "D", statut: "libre", description: "",
};

type Props = {
  bien?: Bien;
  onSuccess: (bien: Bien) => void;
  onError: (msg: string) => void;
};

export default function BienForm({ bien, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormData>(
    bien ? {
      nom: bien.nom, adresse: bien.adresse, ville: bien.ville, code_postal: bien.code_postal,
      type: bien.type, surface: bien.surface, nb_pieces: bien.nb_pieces, etage: bien.etage,
      loyer_base: bien.loyer_base, charges: bien.charges, depot_garantie: bien.depot_garantie,
      dpe: bien.dpe, statut: bien.statut, description: bien.description,
    } : EMPTY
  );
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = bien ? await updateBien(bien.id, form) : await createBien(form);
      onSuccess(result);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelCls}>Nom du bien *</label>
          <input className={inputCls} value={form.nom} onChange={e => set("nom", e.target.value)} required placeholder="Ex: Appt Gambetta T3" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Adresse *</label>
          <input className={inputCls} value={form.adresse} onChange={e => set("adresse", e.target.value)} required placeholder="12 rue des Lilas" />
        </div>
        <div>
          <label className={labelCls}>Ville</label>
          <input className={inputCls} value={form.ville} onChange={e => set("ville", e.target.value)} placeholder="Paris" />
        </div>
        <div>
          <label className={labelCls}>Code postal</label>
          <input className={inputCls} value={form.code_postal} onChange={e => set("code_postal", e.target.value)} placeholder="75011" />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value as FormData["type"])}>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="local_commercial">Local commercial</option>
            <option value="parking">Parking</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.statut} onChange={e => set("statut", e.target.value as FormData["statut"])}>
            <option value="libre">Libre</option>
            <option value="occupe">Occupé</option>
            <option value="en_travaux">En travaux</option>
            <option value="a_vendre">À vendre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Surface (m²)</label>
          <input className={inputCls} type="number" value={form.surface || ""} onChange={e => set("surface", parseFloat(e.target.value) || 0)} placeholder="45" />
        </div>
        <div>
          <label className={labelCls}>Pièces</label>
          <input className={inputCls} type="number" value={form.nb_pieces || ""} onChange={e => set("nb_pieces", parseInt(e.target.value) || 0)} placeholder="3" />
        </div>
        <div>
          <label className={labelCls}>Loyer de base (DH)</label>
          <input className={inputCls} type="number" value={form.loyer_base || ""} onChange={e => set("loyer_base", parseFloat(e.target.value) || 0)} placeholder="850" />
        </div>
        <div>
          <label className={labelCls}>Charges (DH)</label>
          <input className={inputCls} type="number" value={form.charges || ""} onChange={e => set("charges", parseFloat(e.target.value) || 0)} placeholder="80" />
        </div>
        <div>
          <label className={labelCls}>Dépôt de garantie (DH)</label>
          <input className={inputCls} type="number" value={form.depot_garantie || ""} onChange={e => set("depot_garantie", parseFloat(e.target.value) || 0)} placeholder="1700" />
        </div>
        <div>
          <label className={labelCls}>DPE</label>
          <select className={inputCls} value={form.dpe} onChange={e => set("dpe", e.target.value as FormData["dpe"])}>
            {["A","B","C","D","E","F","G"].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Informations complémentaires..." />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Enregistrement..." : bien ? "Mettre à jour" : "Ajouter le bien"}
      </button>
    </form>
  );
}
