"use client";
import { useState, useEffect } from "react";
import { Loyer, createLoyer, updateLoyer } from "@/lib/supabase/loyers";
import { getBiens } from "@/lib/supabase/biens";
import { getLocataires } from "@/lib/supabase/locataires";

type FormData = Omit<Loyer, "id" | "owner_id" | "created_at" | "bien_nom" | "locataire_nom">;

const EMPTY: FormData = {
  bien_id: null,
  locataire_id: null,
  montant: 0,
  date_echeance: new Date().toISOString().slice(0, 10),
  date_paiement: null,
  statut: "en_attente",
  type: "loyer",
  notes: "",
};

type Props = {
  loyer?: Loyer;
  onSuccess: (l: Loyer) => void;
  onError: (msg: string) => void;
};

export default function LoyerForm({ loyer, onSuccess, onError }: Props) {
  const [form, setForm] = useState<FormData>(
    loyer ? {
      bien_id: loyer.bien_id,
      locataire_id: loyer.locataire_id,
      montant: loyer.montant,
      date_echeance: loyer.date_echeance,
      date_paiement: loyer.date_paiement,
      statut: loyer.statut,
      type: loyer.type,
      notes: loyer.notes,
    } : EMPTY
  );
  const [biens, setBiens] = useState<{ id: string; nom: string }[]>([]);
  const [locataires, setLocataires] = useState<{ id: string; nom: string; prenom: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBiens().then(b => setBiens(b.map(x => ({ id: x.id, nom: x.nom }))));
    getLocataires().then(l => setLocataires(l.map(x => ({ id: x.id, nom: x.nom, prenom: x.prenom }))));
  }, []);

  const set = (k: keyof FormData, v: string | number | null) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = loyer
        ? await updateLoyer(loyer.id, form)
        : await createLoyer(form);
      onSuccess(result);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Bien</label>
        <select
          className={inputCls}
          value={form.bien_id ?? ""}
          onChange={e => set("bien_id", e.target.value || null)}
        >
          <option value="">— Sélectionner un bien —</option>
          {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Locataire</label>
        <select
          className={inputCls}
          value={form.locataire_id ?? ""}
          onChange={e => set("locataire_id", e.target.value || null)}
        >
          <option value="">— Sélectionner un locataire —</option>
          {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select className={inputCls} value={form.type} onChange={e => set("type", e.target.value)}>
            <option value="loyer">Loyer</option>
            <option value="charge">Charge</option>
            <option value="depot_garantie">Dépôt de garantie</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Statut</label>
          <select className={inputCls} value={form.statut} onChange={e => set("statut", e.target.value)}>
            <option value="en_attente">En attente</option>
            <option value="paye">Payé</option>
            <option value="retard">Retard</option>
            <option value="partiel">Partiel</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Montant (€) *</label>
          <input
            className={inputCls}
            type="number"
            step="0.01"
            value={form.montant || ""}
            onChange={e => set("montant", parseFloat(e.target.value) || 0)}
            required
            placeholder="850"
          />
        </div>
        <div>
          <label className={labelCls}>Date d&apos;échéance *</label>
          <input
            className={inputCls}
            type="date"
            value={form.date_echeance}
            onChange={e => set("date_echeance", e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Date de paiement</label>
          <input
            className={inputCls}
            type="date"
            value={form.date_paiement ?? ""}
            onChange={e => set("date_paiement", e.target.value || null)}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          className={`${inputCls} resize-none`}
          rows={2}
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Remarques éventuelles..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-2"
        style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {loading ? "Enregistrement..." : loyer ? "Mettre à jour" : "Enregistrer le paiement"}
      </button>
    </form>
  );
}
