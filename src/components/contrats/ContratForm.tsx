"use client";
import { useEffect, useState } from "react";
import { Contrat, createContrat, updateContrat, TypeBail, StatutContrat } from "@/lib/supabase/contrats";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLocataires, Locataire } from "@/lib/supabase/locataires";

type Props = {
  contrat?: Contrat;
  onSuccess: (c: Contrat) => void;
  onError: (msg: string) => void;
};

const TYPE_BAIL_OPTIONS: { value: TypeBail; label: string }[] = [
  { value: "vide", label: "Location vide" },
  { value: "meuble", label: "Location meublée" },
  { value: "commercial", label: "Bail commercial" },
  { value: "saisonnier", label: "Bail saisonnier" },
  { value: "autre", label: "Autre" },
];

const STATUT_OPTIONS: { value: StatutContrat; label: string }[] = [
  { value: "actif", label: "Actif" },
  { value: "en_attente", label: "En attente" },
  { value: "termine", label: "Terminé" },
  { value: "resilie", label: "Résilié" },
];

const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-xs font-semibold text-slate-600 mb-1";

export default function ContratForm({ contrat, onSuccess, onError }: Props) {
  const isEdit = !!contrat;
  const [saving, setSaving] = useState(false);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);

  const [form, setForm] = useState({
    bien_id: contrat?.bien_id ?? "",
    locataire_id: contrat?.locataire_id ?? "",
    date_debut: contrat?.date_debut ?? "",
    date_fin: contrat?.date_fin ?? "",
    loyer_mensuel: contrat?.loyer_mensuel ?? 0,
    charges_mensuelles: contrat?.charges_mensuelles ?? 0,
    depot_garantie: contrat?.depot_garantie ?? 0,
    type_bail: (contrat?.type_bail ?? "vide") as TypeBail,
    statut: (contrat?.statut ?? "actif") as StatutContrat,
    reconduction_tacite: contrat?.reconduction_tacite ?? true,
    preavis_mois: contrat?.preavis_mois ?? 3,
    notes: contrat?.notes ?? "",
  });

  useEffect(() => {
    Promise.all([getBiens(), getLocataires()]).then(([b, l]) => {
      setBiens(b);
      setLocataires(l);
    });
  }, []);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bien_id) { onError("Veuillez sélectionner un bien"); return; }
    if (!form.locataire_id) { onError("Veuillez sélectionner un locataire"); return; }
    if (!form.date_debut) { onError("La date de début est obligatoire"); return; }
    if (form.loyer_mensuel <= 0) { onError("Le loyer mensuel doit être supérieur à 0"); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        date_fin: form.date_fin || null,
        loyer_mensuel: Number(form.loyer_mensuel),
        charges_mensuelles: Number(form.charges_mensuelles),
        depot_garantie: Number(form.depot_garantie),
        preavis_mois: Number(form.preavis_mois),
      };
      const saved = isEdit
        ? await updateContrat(contrat.id, payload)
        : await createContrat(payload);
      onSuccess(saved);
    } catch (err: any) {
      onError(err?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-6">
      {/* Bien + Locataire */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={labelClass}>Bien *</label>
          <select className={inputClass} value={form.bien_id} onChange={e => set("bien_id", e.target.value)} required>
            <option value="">Sélectionner un bien</option>
            {biens.map(b => (
              <option key={b.id} value={b.id}>{b.nom} — {b.adresse}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Locataire *</label>
          <select className={inputClass} value={form.locataire_id} onChange={e => set("locataire_id", e.target.value)} required>
            <option value="">Sélectionner un locataire</option>
            {locataires.map(l => (
              <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date de début *</label>
          <input type="date" className={inputClass} value={form.date_debut} onChange={e => set("date_debut", e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Date de fin</label>
          <input type="date" className={inputClass} value={form.date_fin ?? ""} onChange={e => set("date_fin", e.target.value)} />
        </div>
      </div>

      {/* Montants */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Conditions financières</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Loyer mensuel (DH) *</label>
            <input type="number" min={0} step={0.01} className={inputClass} value={form.loyer_mensuel} onChange={e => set("loyer_mensuel", Number(e.target.value))} required />
          </div>
          <div>
            <label className={labelClass}>Charges (DH)</label>
            <input type="number" min={0} step={0.01} className={inputClass} value={form.charges_mensuelles} onChange={e => set("charges_mensuelles", Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Dépôt de garantie (DH)</label>
            <input type="number" min={0} step={0.01} className={inputClass} value={form.depot_garantie} onChange={e => set("depot_garantie", Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Type bail + Statut */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Type de bail</label>
          <select className={inputClass} value={form.type_bail} onChange={e => set("type_bail", e.target.value as TypeBail)}>
            {TYPE_BAIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <select className={inputClass} value={form.statut} onChange={e => set("statut", e.target.value as StatutContrat)}>
            {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Reconduction + Préavis */}
      <div className="grid grid-cols-2 gap-4 items-end">
        <div>
          <label className={labelClass}>Préavis (mois)</label>
          <input type="number" min={0} max={24} className={inputClass} value={form.preavis_mois} onChange={e => set("preavis_mois", Number(e.target.value))} />
        </div>
        <div className="flex items-center gap-3 pb-1">
          <input
            id="reconduction"
            type="checkbox"
            checked={form.reconduction_tacite}
            onChange={e => set("reconduction_tacite", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="reconduction" className="text-sm text-slate-700">Reconduction tacite</label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={3}
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Conditions particulières, observations..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
      >
        {saving ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer le contrat"}
      </button>
    </form>
  );
}
