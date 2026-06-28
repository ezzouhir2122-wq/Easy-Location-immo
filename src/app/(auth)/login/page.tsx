"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0B1A2F 0%, #152238 100%)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", fontFamily: "Syne, sans-serif" }}
          >
            EL
          </div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
            Easy Location IMMO
          </h1>
          <p className="text-slate-400 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="vous@exemple.fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all"
              style={{
                background: loading ? "#93C5FD" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Pas encore de compte ?{" "}
            <a href="/register" className="text-blue-600 font-medium hover:underline">
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
