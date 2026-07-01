"use client";
import { useState, useEffect } from "react";
import { Charge, createCharge, updateCharge } from "@/lib/supabase/charges";
import { getBiens } from "@/lib/supabase/biens";

type FormData = Omit<Charge, "id" | "owner_id" | "created_at" | "bien_nom">;

const EMPTY: FormData = {
  bien_id: null, type: "autre", montant: 0,
  date: new Date().toISOString().slice(0, 10),
  description: "", statut: "en_attente",
};

const TYPE_LABELS: Record<string, string> = {
  eau: "Eau", electricite: "Électricité", internet: "Internet",
  assurance: "Assurance", entretien: "Entretien", taxe: "Taxe", autre: "Autre",
};

type Props = {
  charge?: Charge;
  onSuccess: (c: Charge) => void;
  onError: (msg: string) => void;
};

export default function ChargeForm({ charge, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormData>(charge ? {
    bien_id: charge.bien_id, type: charge.type, montant: charge.montant,
    date: charge.date, description: charge.description, statut: charge.statut,
  } : EMPTY);
  const [biens, setBiens] = useState<{ id: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBiens().then(b => setBiens(b.map(x => ({ id: x.id, nom: x.nom }))));
  }, []);

  const set = (k: keyof FormData, v: string | number | null) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = charge ? await updateCharge(charge.id, form) : await createCharge(form);
      onSuccess(result);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally { setLoading(false); }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Bien</label>
        <select className={inputCls} value={form.bien_id ?? ""} onChange={e => set("bien_id", e.target.value || null)}>
          <option value="">— Sélectionner un bien —</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type *</label>
          <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value)} required>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.statut} onChange={e => set("statut", e.target.value)}>
            <option value="en_attente">En attente</option>
            <option value="paye">Payé</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Montant (DH) *</label>
          <input className={inputCls} type="number" step="0.01" value={form.montant || ""} onChange={e => set("montant", parseFloat(e.target.value) || 0)} required placeholder="250" />
        </div>
        <div>
          <label className={labelCls}>Date *</label>
          <input className={inputCls} type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
        </div>
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <input className={inputCls} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Ex: Facture eau avril 2026" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Enregistrement..." : charge ? "Mettre à jour" : "Ajouter la charge"}
      </button>
    </form>
  );
}
