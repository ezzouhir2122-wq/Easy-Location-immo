"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bien, getBiens } from "@/lib/supabase/biens";
import { ComptaCompte, ComptaEcriture, createComptaCompte, createComptaEcriture, getComptaComptes, getComptaEcritures, validateComptaEcriture } from "@/lib/supabase/conciergerie";

const defaultAccounts = [
  { code: "512000", libelle: "Banque", classe: 5 },
  { code: "706000", libelle: "Revenus locatifs", classe: 7 },
  { code: "613000", libelle: "Charges d'entretien", classe: 6 },
  { code: "445710", libelle: "TVA collectée", classe: 4 },
  { code: "411000", libelle: "Locataires / Clients", classe: 4 },
  { code: "401000", libelle: "Fournisseurs", classe: 4 },
  { code: "616000", libelle: "Primes d'assurance", classe: 6 },
  { code: "614000", libelle: "Charges de copropriété", classe: 6 },
];

const classeLabel: Record<number, string> = { 1: "Comptes de capitaux", 2: "Immobilisations", 3: "Stocks", 4: "Tiers", 5: "Financiers", 6: "Charges", 7: "Produits" };
const classeColor: Record<number, string> = { 4: "#8B5CF6", 5: "#2563EB", 6: "#EF4444", 7: "#10B981" };

export default function ComptabilitePage() {
  const [accounts, setAccounts] = useState<ComptaCompte[]>([]);
  const [entries, setEntries] = useState<ComptaEcriture[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"journal" | "comptes">("journal");
  const [form, setForm] = useState({
    bien_id: "", date_operation: new Date().toISOString().slice(0, 10),
    libelle: "", reference: "", compte_debit: "512000", compte_credit: "706000", montant: "",
  });
  const [message, setMessage] = useState<{ text: string; type: "info" | "error" | "success" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [a, e, b] = await Promise.all([getComptaComptes(), getComptaEcritures(), getBiens()]);
      setAccounts(a); setEntries(e); setBiens(b);
    } catch (error: any) {
      setMessage({ text: error?.message ?? "Impossible de charger la comptabilité. Vérifiez que les migrations SQL ont été exécutées.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function initialize() {
    setInitializing(true);
    try {
      const created: ComptaCompte[] = [];
      for (const account of defaultAccounts) {
        if (!accounts.some(x => x.code === account.code)) {
          created.push(await createComptaCompte(account));
        }
      }
      if (created.length === 0) {
        setMessage({ text: "Le plan de comptes est déjà initialisé.", type: "info" });
      } else {
        setAccounts(current => [...current, ...created].sort((a, b) => a.code.localeCompare(b.code)));
        setMessage({ text: `${created.length} compte(s) créé(s) avec succès.`, type: "success" });
        setTab("comptes");
      }
    } catch (error: any) {
      setMessage({ text: error?.message ?? "Initialisation impossible.", type: "error" });
    } finally {
      setInitializing(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.montant || Number(form.montant) <= 0) { setMessage({ text: "Montant invalide.", type: "error" }); return; }
    if (form.compte_debit === form.compte_credit) { setMessage({ text: "Les comptes débit et crédit doivent être différents.", type: "error" }); return; }
    try {
      const entry = await createComptaEcriture({ ...form, bien_id: form.bien_id || null, montant: Number(form.montant) });
      setEntries(current => [entry, ...current]);
      setForm(current => ({ ...current, libelle: "", reference: "", montant: "" }));
      setOpen(false);
      setMessage({ text: "Écriture créée en brouillon. Vérifiez-la puis validez.", type: "success" });
      setTab("journal");
    } catch (error: any) {
      setMessage({ text: error?.message ?? "Création impossible.", type: "error" });
    }
  }

  async function validate(id: string) {
    try {
      const entry = await validateComptaEcriture(id);
      setEntries(current => current.map(x => x.id === id ? entry : x));
      setMessage({ text: "Écriture validée — débit = crédit confirmé.", type: "success" });
    } catch (error: any) {
      setMessage({ text: error?.message ?? "Écriture déséquilibrée.", type: "error" });
    }
  }

  const brouillons = entries.filter(e => e.statut === "brouillon").length;
  const validees = entries.filter(e => e.statut === "validee").length;
  const msgColors = { info: "bg-blue-50 text-blue-700", error: "bg-red-50 text-red-700", success: "bg-emerald-50 text-emerald-700" };

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Comptabilité immobilière</h1>
          <p className="mt-1 text-sm text-slate-500">Journal par bien — revenus, charges et rapprochement.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={initialize}
            disabled={initializing}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {initializing ? "Initialisation…" : "Initialiser le plan"}
          </button>
          <button
            onClick={() => { setOpen(x => !x); setTab("journal"); }}
            disabled={accounts.length === 0}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            title={accounts.length === 0 ? "Initialisez d'abord le plan de comptes" : ""}
          >
            {open ? "Fermer" : "+ Nouvelle écriture"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${msgColors[message.type]}`}>
          {message.text}
          <button className="float-right font-bold" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Métriques */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Metric label="Comptes actifs" value={String(accounts.length)} color="#2563EB" />
        <Metric label="Écritures totales" value={String(entries.length)} color="#8B5CF6" />
        <Metric label="Brouillons" value={String(brouillons)} color="#F59E0B" />
        <Metric label="Validées" value={String(validees)} color="#10B981" />
      </div>

      {/* Formulaire nouvelle écriture */}
      {open && (
        <form onSubmit={submit} className="mb-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-800">Nouvelle écriture comptable</h2>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Libellé">
              <input required value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })} className="input" placeholder="Ex: Loyer janvier 2026" />
            </Field>
            <Field label="Date">
              <input required type="date" value={form.date_operation} onChange={e => setForm({ ...form, date_operation: e.target.value })} className="input" />
            </Field>
            <Field label="Montant (DH)">
              <input required min="0.01" step="0.01" type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} className="input" placeholder="0.00" />
            </Field>
            <Field label="Bien (optionnel)">
              <select value={form.bien_id} onChange={e => setForm({ ...form, bien_id: e.target.value })} className="input">
                <option value="">Tous les biens</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </Field>
            <Field label="Compte débit (entrée d'argent)">
              <select value={form.compte_debit} onChange={e => setForm({ ...form, compte_debit: e.target.value })} className="input">
                {accounts.map(a => <option key={a.id} value={a.code}>{a.code} — {a.libelle}</option>)}
              </select>
            </Field>
            <Field label="Compte crédit (origine)">
              <select value={form.compte_credit} onChange={e => setForm({ ...form, compte_credit: e.target.value })} className="input">
                {accounts.map(a => <option key={a.id} value={a.code}>{a.code} — {a.libelle}</option>)}
              </select>
            </Field>
            <Field label="Référence (optionnel)">
              <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="input" placeholder="N° facture, contrat…" />
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <button className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Créer le brouillon</button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 w-fit">
        {(["journal", "comptes"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0f172a" : "#64748b", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
          >
            {t === "journal" ? `Journal (${entries.length})` : `Plan de comptes (${accounts.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      ) : tab === "journal" ? (
        entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="mb-4 text-5xl">📒</div>
            <h3 className="font-semibold text-slate-700">Journal vide</h3>
            <p className="mt-1 mb-5 text-sm text-slate-400">
              {accounts.length === 0
                ? "Commencez par initialiser le plan de comptes."
                : "Créez votre première écriture comptable."}
            </p>
            {accounts.length === 0 ? (
              <button onClick={initialize} className="text-sm font-semibold text-blue-600">Initialiser le plan de comptes</button>
            ) : (
              <button onClick={() => setOpen(true)} className="text-sm font-semibold text-blue-600">+ Nouvelle écriture</button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Date</Th><Th>Libellé</Th><Th>Bien</Th><Th>Source</Th><Th>Statut</Th><Th />
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-500">{new Date(entry.date_operation).toLocaleDateString("fr-FR")}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {entry.libelle}
                      <div className="text-xs text-slate-400">{entry.reference || "Sans référence"}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{biens.find(b => b.id === entry.bien_id)?.nom || "—"}</td>
                    <td className="px-5 py-4 capitalize text-slate-500">{entry.source_type}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.statut === "brouillon" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {entry.statut === "brouillon" ? "Brouillon" : "Validée"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {entry.statut === "brouillon" && (
                        <button onClick={() => validate(entry.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">Valider</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-20 text-center">
            <div className="mb-4 text-5xl">📂</div>
            <h3 className="font-semibold text-slate-700">Plan de comptes vide</h3>
            <p className="mt-1 mb-5 text-sm text-slate-400">Cliquez sur "Initialiser le plan" pour créer les comptes de base.</p>
            <button onClick={initialize} className="text-sm font-semibold text-blue-600">Initialiser maintenant</button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <Th>Code</Th><Th>Libellé</Th><Th>Classe</Th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">{account.code}</td>
                    <td className="px-5 py-3 text-slate-700">{account.libelle}</td>
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: `${classeColor[account.classe] ?? "#64748b"}18`, color: classeColor[account.classe] ?? "#64748b" }}
                      >
                        {account.classe} — {classeLabel[account.classe] ?? "Autre"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" style={{ borderBottom: `3px solid ${color}` }}>
      <p className="mb-1 text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>{value}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">{label}{children}</label>;
}
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400">{children}</th>;
}
