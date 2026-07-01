"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ParametresPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setLoading(false);
    });
  }, []);

  async function handlePasswordReset() {
    if (!email) return;
    const { error } = await createClient().auth.resetPasswordForEmail(email);
    setToast(error ? "Erreur lors de l'envoi" : "Email envoyé — vérifiez votre boîte");
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  const sections = [
    {
      title: "Compte",
      items: [
        { label: "Email", value: loading ? "Chargement..." : email },
        { label: "Devise", value: "Dirham marocain (DH)" },
        { label: "Langue", value: "Français" },
        { label: "Fuseau horaire", value: "Africa/Casablanca (UTC+1)" },
      ],
    },
    {
      title: "Application",
      items: [
        { label: "Version", value: "1.0.0" },
        { label: "Stack", value: "Next.js 14 + Supabase" },
        { label: "Hébergement", value: "Vercel (EU)" },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">Configuration de votre compte et de l&apos;application</p>
      </div>

      {sections.map(section => (
        <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{section.title}</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {section.items.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</h2>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={handlePasswordReset}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition text-left px-4"
          >
            🔐 Réinitialiser le mot de passe
          </button>
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition text-left px-4"
          >
            🚪 Se déconnecter
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 px-5 py-3 rounded-2xl text-white text-sm font-medium shadow-lg" style={{ background: "#0B1A2F" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
