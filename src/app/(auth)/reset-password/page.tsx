"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("");
    const supabase = createClient();
    if (recoveryMode) {
      if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); setLoading(false); return; }
      if (password !== confirmPassword) { setError("Les deux mots de passe ne correspondent pas."); setLoading(false); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) setError(updateError.message);
      else { setMessage("Mot de passe modifié. Redirection vers votre espace de bienvenue..."); setTimeout(() => router.push("/bienvenue"), 1200); }
    } else {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
      if (resetError) setError(resetError.message); else setMessage("Un nouveau lien de réinitialisation vient d’être envoyé. Utilisez le dernier email reçu.");
    }
    setLoading(false);
  }

  return <div className="flex min-h-screen items-center justify-center" style={{ background: "linear-gradient(135deg, #0B1A2F 0%, #152238 100%)" }}><div className="w-full max-w-md"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>EL</div><h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>{recoveryMode ? "Choisir un nouveau mot de passe" : "Réinitialiser le mot de passe"}</h1><p className="mt-1 text-sm text-slate-400">Easy Location IMMO</p></div><div className="rounded-2xl bg-white p-8 shadow-2xl"><form onSubmit={handleSubmit} className="space-y-5">{recoveryMode ? <><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau mot de passe</label><input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label className="mb-1.5 block text-sm font-medium text-slate-700">Confirmer le mot de passe</label><input required minLength={6} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></> : <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Adresse email</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="vous@exemple.com" /></div>}{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}{message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>}<button disabled={loading} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}>{loading ? "Traitement…" : recoveryMode ? "Modifier le mot de passe" : "Envoyer le lien"}</button></form><p className="mt-6 text-center text-xs text-slate-400"><Link href="/login" className="font-medium text-blue-600 hover:underline">Retour à la connexion</Link></p></div></div></div>;
}
