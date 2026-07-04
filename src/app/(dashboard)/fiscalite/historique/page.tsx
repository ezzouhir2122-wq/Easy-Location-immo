"use client";
import { useEffect, useState } from "react";
import { getCalculationHistory } from "@/lib/fiscal/supabase/tax-calculations";
import Link from "next/link";

export default function HistoriquePage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const years = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    setLoading(true);
    getCalculationHistory(filterYear)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [filterYear]);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Historique fiscal
          </h1>
          <p className="text-slate-500 text-sm mt-1">Registre immuable — aucune modification possible</p>
        </div>
        <select
          value={filterYear ?? ""}
          onChange={e => setFilterYear(e.target.value ? parseInt(e.target.value) : undefined)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm bg-white"
        >
          <option value="">Toutes les années</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <span className="text-3xl block mb-3">📜</span>
          <p className="text-slate-400 text-sm">Aucun calcul enregistré pour cette période</p>
          <Link href="/fiscalite/calculateur" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            Faire un calcul →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-5 py-3 text-left font-semibold">Bien</th>
                <th className="px-5 py-3 text-center font-semibold">Année</th>
                <th className="px-5 py-3 text-right font-semibold">IR Net</th>
                <th className="px-5 py-3 text-center font-semibold">Type</th>
                <th className="px-5 py-3 text-center font-semibold">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((calc) => {
                const impotNet = (calc.result as any)?.impot_net ?? 0;
                return (
                  <tr key={calc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(calc.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {(calc.biens as any)?.nom ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-center text-slate-600">{calc.fiscal_year}</td>
                    <td className="px-5 py-4 text-right font-bold" style={{ color: impotNet === 0 ? "#10B981" : "#EF4444" }}>
                      {impotNet.toLocaleString("fr-FR")} DH
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        calc.is_simulation
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {calc.is_simulation ? "Simulation" : "Officiel"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/fiscalite/audit/${calc.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Voir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
