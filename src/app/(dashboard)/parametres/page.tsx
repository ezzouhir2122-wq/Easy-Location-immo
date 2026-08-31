"use client";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getProfile, upsertProfile, type Profile } from "@/lib/supabase/profiles";

type Toast = { text: string; type: "success" | "error" };

const blank: Omit<Profile, "id" | "email"> = {
  nom: "", prenom: "", telephone: "", cin: "", adresse: "", ville: "", societe: "", rib: "",
};

export default function ParametresPage() {
  const [email, setEmail] = useState("");
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setEmail(p.email);
        setForm({ nom: p.nom, prenom: p.prenom, telephone: p.telephone, cin: p.cin, adresse: p.adresse, ville: p.ville, societe: p.societe, rib: p.rib });
      }
      setLoading(false);
    });
  }, []);

  function set<K extends keyof typeof blank>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function showToast(text: string, type: Toast["type"]) {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertProfile(form);
      showToast("Profil enregistré avec succès.", "success");
    } catch (err: any) {
      showToast(err?.message ?? "Erreur lors de la sauvegarde.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordReset() {
    if (!email) return;
    const { error } = await createClient().auth.resetPasswordForEmail(email);
    showToast(error ? "Erreur lors de l'envoi." : "Email envoyé — vérifiez votre boîte.", error ? "error" : "success");
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  const initials = [form.prenom, form.nom].filter(Boolean).map(s => s[0]).join("").toUpperCase() || email.slice(0, 2).toUpperCase() || "?";
  const displayName = [form.prenom, form.nom].filter(Boolean).join(" ") || email || "Propriétaire";

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">Profil propriétaire et configuration du compte</p>
      </div>

      {/* Avatar + nom */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        >
          {initials}
        </div>
        <div>
          <p className="font-bold text-slate-800">{displayName}</p>
          <p className="text-sm text-slate-400">{email}</p>
          {form.societe && <p className="text-xs text-slate-400 mt-0.5">{form.societe}</p>}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">

          {/* Identité */}
          <Section title="Identité">
            <Grid>
              <Field label="Prénom">
                <input value={form.prenom} onChange={e => set("prenom", e.target.value)} className="input" placeholder="Mohammed" />
              </Field>
              <Field label="Nom">
                <input value={form.nom} onChange={e => set("nom", e.target.value)} className="input" placeholder="El Alami" />
              </Field>
              <Field label="CIN">
                <input value={form.cin} onChange={e => set("cin", e.target.value)} className="input" placeholder="AB123456" maxLength={20} />
              </Field>
              <Field label="Téléphone">
                <input value={form.telephone} onChange={e => set("telephone", e.target.value)} className="input" placeholder="+212 6XX XXX XXX" />
              </Field>
            </Grid>
          </Section>

          {/* Adresse */}
          <Section title="Adresse">
            <Grid>
              <Field label="Adresse" className="col-span-2">
                <input value={form.adresse} onChange={e => set("adresse", e.target.value)} className="input" placeholder="12, rue Mohammed V" />
              </Field>
              <Field label="Ville">
                <input value={form.ville} onChange={e => set("ville", e.target.value)} className="input" placeholder="Marrakech" />
              </Field>
            </Grid>
          </Section>

          {/* Société & Banque */}
          <Section title="Société & Banque">
            <Grid>
              <Field label="Raison sociale (optionnel)" className="col-span-2">
                <input value={form.societe} onChange={e => set("societe", e.target.value)} className="input" placeholder="SCI Al Amal" />
              </Field>
              <Field label="RIB / IBAN" className="col-span-2">
                <input value={form.rib} onChange={e => set("rib", e.target.value)} className="input" placeholder="MA64 XXX XXXX XXXX XXXX" />
              </Field>
            </Grid>
          </Section>

          {/* Compte */}
          <Section title="Compte">
            <div className="flex items-center justify-between px-1 py-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Email de connexion</p>
                <p className="text-sm text-slate-400">{email}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Non modifiable</span>
            </div>
            <div className="flex items-center justify-between px-1 py-2 border-t border-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Devise</p>
                <p className="text-sm text-slate-400">Dirham marocain (DH)</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-1 py-2 border-t border-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">Fuseau horaire</p>
                <p className="text-sm text-slate-400">Africa/Casablanca (UTC+1)</p>
              </div>
            </div>
          </Section>

          {/* Bouton sauvegarde */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              {saving ? "Enregistrement…" : "Enregistrer le profil"}
            </button>
          </div>
        </form>
      )}

      {/* Actions danger */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Actions</h2>
        </div>
        <div className="p-6 space-y-3">
          <button onClick={handlePasswordReset} className="w-full rounded-xl bg-blue-50 px-4 py-2.5 text-left text-sm font-medium text-blue-600 transition hover:bg-blue-100">
            🔐 Réinitialiser le mot de passe
          </button>
          <button onClick={handleSignOut} className="w-full rounded-xl bg-red-50 px-4 py-2.5 text-left text-sm font-medium text-red-500 transition hover:bg-red-100">
            🚪 Se déconnecter
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-lg"
          style={{ background: toast.type === "success" ? "#10B981" : "#EF4444" }}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-slate-500 ${className ?? ""}`}>
      {label}
      {children}
    </label>
  );
}
