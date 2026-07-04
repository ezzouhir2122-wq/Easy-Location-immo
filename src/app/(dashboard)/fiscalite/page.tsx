"use client";
import { useEffect, useState } from "react";
import { getCalculationHistory } from "@/lib/fiscal/supabase/tax-calculations";
import { getLoyers } from "@/lib/supabase/loyers";
import { getCharges } from "@/lib/supabase/charges";
import Link from "next/link";

export default function FiscalDashboardPage() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    revenuBrut: 0, charges: 0, nbCalculs: 0, dernierImpot: 0
  });

  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [loyers, chgs, history] = await Promise.all([
          getLoyers(),
          getCharges(),
          getCalculationHistory(annee),
        ]);
        const rev = loyers
          .filter(l => l.statut === "paye" && new Date(l.date_echeance).getFullYear() === annee)
          .reduce((s, l) => s + l.montant, 0);
        const chg = chgs
          .filter(c => c.statut === "paye" && new Date(c.date).getFullYear() === annee)
          .reduce((s, c) => s + c.montant, 0);
        const dernierCalc = history?.[0];
        const dernierImpot = dernierCalc
          ? (dernierCalc.result as any)?.impot_net ?? 0 : 0;
        setData({ revenuBrut: rev, charges: chg, nbCalculs: history?.length ?? 0, dernierImpot });
      } finally { setLoading(false); }
    }
    load();
  }, [annee]);

  const kpis = [
    { label: "Revenus bruts", value: data.revenuBrut, color: "#10B981", suffix: "DH" },
    { label: "Charges payées", value: data.charges, color: "#EF4444", suffix: "DH" },
    { label: "Calculs enregistrés", value: data.nbCalculs, color: "#2563EB", suffix: "" },
    { label: "Dernier IR calculé", value: data.dernierImpot, color: "#F59E0B", suffix: "DH" },
  ];

  const shortcuts = [
    { href: "/fiscalite/calculateur", icon: "🧮", label: "Calculateur IR", desc: "Calcul complet 14 étapes" },
    { href: "/fiscalite/simulation",  icon: "⚡", label: "Simulation",     desc: "Résultat temps réel" },
    { href: "/fiscalite/historique",  icon: "📜", label: "Historique",     desc: "Tous vos calculs" },
    { href: "/fiscalite/configuration", icon: "⚙️", label: "Configuration", desc: "Barèmes & règles" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Dashboard Fiscal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Moteur fiscal marocain — CGI · LF {annee}
          </p>
        </div>
        <select
          value={annee}
          onChange={e => setAnnee(parseInt(e.target.value))}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map(({ label, value, color, suffix }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className="text-xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                {value.toLocaleString("fr-FR")}{suffix ? ` ${suffix}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {shortcuts.map(({ href, icon, label, desc }) => (
          <Link
            key={href} href={href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
          >
            <span className="text-2xl block mb-2">{icon}</span>
            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Info fiscale */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-700 mb-4">
          Cadre légal — IR Foncier Maroc {annee}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            ["Référence légale", "Code Général des Impôts (CGI)"],
            ["Régime forfaitaire", "15% si revenus bruts ≤ 120 000 DH/an"],
            ["Abattement forfaitaire", "40% sur les revenus bruts (Art. 64-I)"],
            ["Régime réel", "Barème progressif 0% → 38% (Art. 73-II-B)"],
            ["Déclaration annuelle", "Avant le 31 mars de l'année N+1"],
            ["Organisme", "Direction Générale des Impôts (DGI)"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
              <span className="text-slate-400 text-xs">{k}</span>
              <span className="font-medium text-slate-700 text-xs text-right max-w-[55%]">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
          Tous les calculs sont effectués en temps réel depuis le référentiel CGI — aucun taux hardcodé.
        </p>
      </div>
    </div>
  );
}
