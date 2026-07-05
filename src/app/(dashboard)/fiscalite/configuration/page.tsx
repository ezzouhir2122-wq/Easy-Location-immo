"use client";
import { useEffect, useState } from "react";
import { getAllTaxLaws } from "@/lib/fiscal/supabase/tax-laws";
import { getAllBrackets } from "@/lib/fiscal/supabase/tax-brackets";
import { getAllRules } from "@/lib/fiscal/supabase/tax-rules";
import { TaxBracketTable } from "@/components/fiscal/TaxBracketTable";
import type { TaxLawRow, TaxBracketRow, TaxRuleRow } from "@/lib/fiscal/engine/types";

type Tab = "lois" | "bareme" | "regles";

// Données statiques 2026 — utilisées si la DB Supabase n'est pas encore seedée
const STATIC_LAW: TaxLawRow = {
  id: "static-2026", finance_year: 2026, law_number: "n°70-25",
  title: "Loi de Finances pour l'année budgétaire 2026",
  publication_date: "2025-12-31", effective_date: "2026-01-01",
  expiration_date: null, official_ref: "Bulletin Officiel n°7350 du 31 décembre 2025",
  source_url: null, status: "active", notes: "Données intégrées (seed SQL non exécuté)", created_at: "",
};

const STATIC_BRACKETS: TaxBracketRow[] = [
  { id:"sb1", law_id:"static-2026", tax_type:"ir_foncier", property_type:null, usage_type:null, tranche_min:0,      tranche_max:40000,  rate:0.00, deduction_fixe:0,     abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
  { id:"sb2", law_id:"static-2026", tax_type:"ir_foncier", property_type:null, usage_type:null, tranche_min:40001,  tranche_max:60000,  rate:0.10, deduction_fixe:4000,  abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
  { id:"sb3", law_id:"static-2026", tax_type:"ir_foncier", property_type:null, usage_type:null, tranche_min:60001,  tranche_max:80000,  rate:0.20, deduction_fixe:10000, abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
  { id:"sb4", law_id:"static-2026", tax_type:"ir_foncier", property_type:null, usage_type:null, tranche_min:80001,  tranche_max:100000, rate:0.30, deduction_fixe:18000, abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
  { id:"sb5", law_id:"static-2026", tax_type:"ir_foncier", property_type:null, usage_type:null, tranche_min:100001, tranche_max:180000, rate:0.34, deduction_fixe:22000, abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
  { id:"sb6", law_id:"static-2026", tax_type:"ir_foncier", property_type:null, usage_type:null, tranche_min:180001, tranche_max:null,   rate:0.37, deduction_fixe:27400, abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
  { id:"sb7", law_id:"static-2026", tax_type:"ir_foncier_forfaitaire", property_type:null, usage_type:null, tranche_min:0, tranche_max:120000, rate:0.15, deduction_fixe:0, abattement_rate:0, effective_date:"2026-01-01", expiration_date:null, article_cgi:"Art. 73-II-B CGI", loi_finances:"LF 2026", created_at:"" },
];

export default function ConfigurationPage() {
  const [tab, setTab] = useState<Tab>("bareme");
  const [laws, setLaws] = useState<TaxLawRow[]>([STATIC_LAW]);
  const [brackets, setBrackets] = useState<TaxBracketRow[]>(STATIC_BRACKETS);
  const [rules, setRules] = useState<TaxRuleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllTaxLaws(), getAllBrackets(), getAllRules()])
      .then(([l, b, r]) => {
        if (l.length > 0) setLaws(l);
        if (b.length > 0) setBrackets(b);
        if (r.length > 0) setRules(r);
      })
      .catch(() => { /* silencieux — données statiques déjà affichées */ })
      .finally(() => setLoading(false));
  }, []);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "lois",    label: "Lois de Finances", count: laws.length },
    { id: "bareme",  label: "Barèmes IR",       count: brackets.filter(b => b.tax_type === "ir_foncier").length },
    { id: "regles",  label: "Règles CGI",        count: rules.length },
  ];

  const STATUS_COLORS: Record<string, string> = {
    active:     "bg-green-100 text-green-700",
    draft:      "bg-slate-100 text-slate-600",
    superseded: "bg-amber-100 text-amber-700",
    repealed:   "bg-red-100 text-red-700",
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Configuration fiscale
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Référentiel CGI — lecture seule. Pour ajouter une Loi de Finances, exécuter le script SQL de seed.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            <span className={`ml-2 text-xs rounded-full px-1.5 py-0.5 ${
              tab === t.id ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl animate-pulse bg-slate-100" />)}
        </div>
      ) : (
        <>
          {/* Lois */}
          {tab === "lois" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs">
                    <th className="px-5 py-3 text-left font-semibold">Année</th>
                    <th className="px-5 py-3 text-left font-semibold">Numéro</th>
                    <th className="px-5 py-3 text-left font-semibold">Référence B.O.</th>
                    <th className="px-5 py-3 text-center font-semibold">En vigueur</th>
                    <th className="px-5 py-3 text-center font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {laws.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">{l.finance_year}</td>
                      <td className="px-5 py-4 text-slate-600">{l.law_number}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{l.official_ref}</td>
                      <td className="px-5 py-4 text-center text-slate-600">
                        {new Date(l.effective_date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status] ?? "bg-slate-100"}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Barèmes */}
          {tab === "bareme" && (
            <TaxBracketTable brackets={brackets.filter(b => b.tax_type === "ir_foncier" && new Date(b.effective_date).getFullYear() === 2026)} />
          )}

          {/* Règles */}
          {tab === "regles" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs">
                    <th className="px-5 py-3 text-left font-semibold">Clé</th>
                    <th className="px-5 py-3 text-left font-semibold">Libellé</th>
                    <th className="px-5 py-3 text-left font-semibold">Catégorie</th>
                    <th className="px-5 py-3 text-left font-semibold">Article CGI</th>
                    <th className="px-5 py-3 text-center font-semibold">Actif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rules.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{r.rule_key}</td>
                      <td className="px-5 py-4 text-slate-700 font-medium">{r.label}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{r.category}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{r.article_cgi ?? "—"}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${r.enabled ? "bg-green-500" : "bg-red-400"}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
