"use client";
import { useEffect, useState } from "react";
import { getBiens } from "@/lib/supabase/biens";
import { getLocataires } from "@/lib/supabase/locataires";
import { getLoyers } from "@/lib/supabase/loyers";
import { getCharges } from "@/lib/supabase/charges";

export default function RapportsPage() {
  const [stats, setStats] = useState({
    nbBiens: 0, nbOccupes: 0, nbLocataires: 0,
    revenusTotal: 0, chargesTotal: 0, loyersEnRetard: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [biens, locataires, loyers, charges] = await Promise.all([
          getBiens(), getLocataires(), getLoyers(), getCharges(),
        ]);
        setStats({
          nbBiens: biens.length,
          nbOccupes: biens.filter(b => b.statut === "occupe").length,
          nbLocataires: locataires.length,
          revenusTotal: loyers.filter(l => l.statut === "paye").reduce((s, l) => s + l.montant, 0),
          chargesTotal: charges.filter(c => c.statut === "paye").reduce((s, c) => s + c.montant, 0),
          loyersEnRetard: loyers.filter(l => l.statut === "retard").length,
        });
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const tauxOccupation = stats.nbBiens > 0 ? Math.round((stats.nbOccupes / stats.nbBiens) * 100) : 0;
  const rentabilite = stats.revenusTotal > 0
    ? Math.round(((stats.revenusTotal - stats.chargesTotal) / stats.revenusTotal) * 100)
    : 0;

  const kpis = [
    { label: "Biens gérés", value: stats.nbBiens, unit: "", color: "#2563EB", icon: "🏠" },
    { label: "Taux d'occupation", value: tauxOccupation, unit: "%", color: "#10B981", icon: "📊" },
    { label: "Locataires actifs", value: stats.nbLocataires, unit: "", color: "#7C3AED", icon: "👥" },
    { label: "Revenus encaissés", value: stats.revenusTotal.toLocaleString("fr-FR"), unit: " DH", color: "#10B981", icon: "💰" },
    { label: "Charges payées", value: stats.chargesTotal.toLocaleString("fr-FR"), unit: " DH", color: "#EF4444", icon: "📉" },
    { label: "Loyers en retard", value: stats.loyersEnRetard, unit: "", color: "#F59E0B", icon: "⚠️" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Rapports</h1>
        <p className="text-slate-500 text-sm mt-1">Vue d&apos;ensemble de votre portefeuille immobilier</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: "#F1F5F9" }} />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {kpis.map(({ label, value, unit, color, icon }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl">{icon}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                  {value}{unit}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Taux d&apos;occupation</h2>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-emerald-500" style={{ fontFamily: "Syne, sans-serif" }}>{tauxOccupation}%</span>
                <span className="text-slate-400 text-sm mb-1">{stats.nbOccupes}/{stats.nbBiens} biens occupés</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mt-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${tauxOccupation}%`, background: "linear-gradient(90deg, #10B981, #059669)" }} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>Rentabilité nette</h2>
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-blue-500" style={{ fontFamily: "Syne, sans-serif" }}>{rentabilite}%</span>
                <span className="text-slate-400 text-sm mb-1">après charges</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mt-3">
                <div className="h-3 rounded-full transition-all" style={{ width: `${Math.min(rentabilite, 100)}%`, background: "linear-gradient(90deg, #2563EB, #1D4ED8)" }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
