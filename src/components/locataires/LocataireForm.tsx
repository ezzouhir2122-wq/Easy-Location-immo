"use client";
import { useState } from "react";
import { Locataire, createLocataire, updateLocataire } from "@/lib/supabase/locataires";

type FormData = Omit<Locataire, "id" | "owner_id" | "created_at">;

const EMPTY: FormData = {
  nom: "", prenom: "", email: "", telephone: "",
  date_naissance: "", lieu_naissance: "", profession: "", revenus_mensuels: 0,
};

type Props = {
  locataire?: Locataire;
  onSuccess: (l: Locataire) => void;
  onError: (msg: string) => void;
};

export default function LocataireForm({ locataire, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormData>(
    locataire ? {
      nom: locataire.nom, prenom: locataire.prenom, email: locataire.email,
      telephone: locataire.telephone, date_naissance: locataire.date_naissance,
      lieu_naissance: locataire.lieu_naissance, profession: locataire.profession,
      revenus_mensuels: locataire.revenus_mensuels,
    } : EMPTY
  );
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormData, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = locataire
        ? await updateLocataire(locataire.id, form)
        : await createLocataire(form);
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
        <div>
          <label className={labelCls}>Prénom *</label>
          <input className={inputCls} value={form.prenom} onChange={e => set("prenom", e.target.value)} required placeholder="Jean" />
        </div>
        <div>
          <label className={labelCls}>Nom *</label>
          <input className={inputCls} value={form.nom} onChange={e => set("nom", e.target.value)} required placeholder="Dupont" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Email</label>
          <input className={inputCls} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jean.dupont@email.fr" />
        </div>
        <div>
          <label className={labelCls}>Téléphone</label>
          <input className={inputCls} value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="06 12 34 56 78" />
        </div>
        <div>
          <label className={labelCls}>Revenus mensuels (DH)</label>
          <input className={inputCls} type="number" value={form.revenus_mensuels || ""} onChange={e => set("revenus_mensuels", parseFloat(e.target.value) || 0)} placeholder="2500" />
        </div>
        <div>
          <label className={labelCls}>Date de naissance</label>
          <input className={inputCls} type="date" value={form.date_naissance} onChange={e => set("date_naissance", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Lieu de naissance</label>
          <input className={inputCls} value={form.lieu_naissance} onChange={e => set("lieu_naissance", e.target.value)} placeholder="Paris (75)" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Profession</label>
          <input className={inputCls} value={form.profession} onChange={e => set("profession", e.target.value)} placeholder="Ingénieur" />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Enregistrement..." : locataire ? "Mettre à jour" : "Ajouter le locataire"}
      </button>
    </form>
  );
}
