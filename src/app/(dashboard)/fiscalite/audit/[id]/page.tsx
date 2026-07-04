"use client";
import { useEffect, useState } from "react";
import { getCalculationById } from "@/lib/fiscal/supabase/tax-calculations";
import { AuditTimeline } from "@/components/fiscal/AuditTimeline";
import { ExemptionBadge } from "@/components/fiscal/ExemptionBadge";
import { RiskFlag } from "@/components/fiscal/RiskFlag";
import { LawReference } from "@/components/fiscal/LawReference";
import Link from "next/link";
import type { TaxResult } from "@/lib/fiscal/engine/types";

interface Props { params: { id: string } }

export default function AuditPage({ params }: Props) {
  const [calc, setCalc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCalculationById(params.id)
      .then(setCalc)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return (
    <div className="p-8"><div className="animate-pulse text-slate-400">Chargement de l&apos;audit...</div></div>
  );
  if (error || !calc) return (
    <div className="p-8">
      <p className="text-red-600">Calcul introuvable.</p>
      <Link href="/fiscalite/historique" className="text-blue-600 text-sm hover:underline mt-2 inline-block">← Retour historique</Link>
    </div>
  );

  const result: TaxResult = calc.result;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/fiscalite/historique" className="text-sm text-blue-600 hover:underline">← Historique</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1" style={{ fontFamily: "Syne, sans-serif" }}>
            Audit Fiscal — {result.fiscal_year}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Calculé le {new Date(result.computed_at).toLocaleDateString("fr-FR")}
            {calc.is_simulation && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Simulation</span>}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:border-blue-300 transition-colors"
        >
          🖨 Imprimer
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Revenu brut", value: result.revenu_brut, color: "#64748B" },
          { label: "RNI", value: result.revenu_net_imposable, color: "#2563EB" },
          { label: "IR Net", value: result.impot_net, color: result.impot_net === 0 ? "#10B981" : "#EF4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-lg font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
              {value.toLocaleString("fr-FR")} DH
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline étapes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Les 14 étapes du calcul</h2>
            <AuditTimeline steps={result.steps} />
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">
          {/* Lois utilisées */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Références légales</h3>
            <div className="space-y-2">
              {result.laws_referenced.map(l => (
                <LawReference key={l.law_id} article={`LF ${l.finance_year}`} note={l.law_number} />
              ))}
              {result.rules_applied.map(r => r.article_cgi && (
                <LawReference key={r.rule_key} article={r.article_cgi} note={r.label} />
              ))}
            </div>
          </div>

          {/* Exonérations */}
          {result.exemptions_appliquees.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Exonérations</h3>
              <div className="space-y-2">
                {result.exemptions_appliquees.map(e => (
                  <ExemptionBadge key={e.exemption_id} exemption={e} />
                ))}
              </div>
            </div>
          )}

          {/* Risques */}
          {result.risques_fiscaux.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Alertes</h3>
              <div className="space-y-2">
                {result.risques_fiscaux.map(r => (
                  <RiskFlag key={r.code} flag={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
