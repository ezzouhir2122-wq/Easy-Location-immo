"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0B1A2F 0%, #152238 100%)" }}
      >
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Vérifiez votre email
          </h2>
          <p className="text-slate-500 text-sm">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0B1A2F 0%, #152238 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontFamily: "Syne, sans-serif" }}
          >
            EL
          </div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            Créer un compte
          </h1>
          <p className="text-slate-400 text-sm mt-1">Easy Location IMMO</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="vous@exemple.fr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Minimum 6 caractères"
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
          <p className="text-center text-xs text-slate-400 mt-6">
            Déjà un compte ?{" "}
            <a href="/login" className="text-blue-600 font-medium hover:underline">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
