"use client";

import { useEffect, useState } from "react";
import { getBiens } from "@/lib/supabase/biens";
import { getLoyers, Loyer } from "@/lib/supabase/loyers";
import { getCharges, Charge } from "@/lib/supabase/charges";

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const CHARGE_COLORS: Record<string, string> = {
  eau: "#2563EB",
  electricite: "#10B981",
  entretien: "#F59E0B",
  assurance: "#EF4444",
  taxe: "#8B5CF6",
  internet: "#06B6D4",
  autre: "#94A3B8",
};

function getLast6Months(): { year: number; month: number; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MOIS_LABELS[d.getMonth()] };
  });
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [loyers, setLoyers] = useState<Loyer[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [nbBiens, setNbBiens] = useState(0);
  const [nbOccupes, setNbOccupes] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [biensData, loyersData, chargesData] = await Promise.all([
          getBiens(), getLoyers(), getCharges(),
        ]);
        setNbBiens(biensData.length);
        setNbOccupes(biensData.filter(b => b.statut === "occupe").length);
        setLoyers(loyersData);
        setCharges(chargesData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const now = new Date();
  const moisCourant = now.getMonth();
  const anneeCourante = now.getFullYear();

  const loyersMoisCourant = loyers.filter(l => {
    const d = new Date(l.date_echeance);
    return d.getMonth() === moisCourant && d.getFullYear() === anneeCourante;
  });
  const totalEncaisse = loyersMoisCourant.filter(l => l.statut === "paye").reduce((s, l) => s + l.montant, 0);
  const totalRetard = loyers.filter(l => l.statut === "retard").reduce((s, l) => s + l.montant, 0);
  const nbRetard = loyers.filter(l => l.statut === "retard").length;
  const chargesMois = charges
    .filter(c => { const d = new Date(c.date); return d.getMonth() === moisCourant && d.getFullYear() === anneeCourante; })
    .reduce((s, c) => s + c.montant, 0);

  // Bar chart — 6 derniers mois
  const last6 = getLast6Months();
  const encaissParMois = last6.map(({ year, month }) =>
    loyers
      .filter(l => {
        const d = new Date(l.date_echeance);
        return l.statut === "paye" && d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, l) => s + l.montant, 0)
  );
  const maxBar = Math.max(...encaissParMois, 1);

  // Donut chart — répartition charges (payées)
  const chargesParType = charges.filter(c => c.statut === "paye").reduce<Record<string, number>>((acc, c) => {
    acc[c.type] = (acc[c.type] ?? 0) + c.montant;
    return acc;
  }, {});
  const totalChargesPaye = Object.values(chargesParType).reduce((s, v) => s + v, 0);
  const donutSegments = (() => {
    if (totalChargesPaye === 0) return [];
    const CIRCLE = 326.73;
    let offset = 0;
    return Object.entries(chargesParType).map(([type, montant]) => {
      const pct = montant / totalChargesPaye;
      const arc = CIRCLE * pct;
      const seg = { type, montant, arc, offset };
      offset += arc;
      return seg;
    });
  })();

  // Derniers loyers (5 max)
  const derniersLoyers = [...loyers].slice(0, 5);

  // Alertes
  const alertes: { icon: string; msg: string; date: string; color: string }[] = [];
  loyers
    .filter(l => l.statut === "retard")
    .slice(0, 2)
    .forEach(l => alertes.push({
      icon: "⚠️",
      msg: `Loyer impayé — ${l.locataire_nom ?? "Locataire"} (${l.bien_nom ?? ""})`,
      date: `Échéance : ${new Date(l.date_echeance).toLocaleDateString("fr-FR")}`,
      color: "#EF4444",
    }));
  loyers
    .filter(l => l.statut === "en_attente")
    .slice(0, 2)
    .forEach(l => alertes.push({
      icon: "⏳",
      msg: `Loyer en attente — ${l.locataire_nom ?? "Locataire"}`,
      date: `Dû le ${new Date(l.date_echeance).toLocaleDateString("fr-FR")}`,
      color: "#F59E0B",
    }));
  if (alertes.length === 0 && !loading) {
    alertes.push({ icon: "✅", msg: "Aucune alerte — tout est à jour", date: "", color: "#10B981" });
  }

  const moisLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Tableau de bord
        </h1>
        <p className="text-slate-500 text-sm mt-1 capitalize">
          Vue d&apos;ensemble de votre portefeuille — {moisLabel}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            <KpiCard
              label="Loyers encaissés"
              value={`${totalEncaisse.toLocaleString("fr-FR")} DH`}
              trend={`ce mois`}
              borderColor="#10B981"
              icon="💶"
            />
            <KpiCard
              label="En retard"
              value={`${totalRetard.toLocaleString("fr-FR")} DH`}
              trend={nbRetard > 0 ? `${nbRetard} locataire${nbRetard > 1 ? "s" : ""}` : "Aucun retard"}
              trendUp={nbRetard === 0 ? true : false}
              borderColor="#EF4444"
              icon="⚠️"
            />
            <KpiCard
              label="Biens gérés"
              value={String(nbBiens)}
              trend={`${nbOccupes} occupé${nbOccupes > 1 ? "s" : ""}`}
              borderColor="#2563EB"
              icon="🏠"
            />
            <KpiCard
              label="Charges du mois"
              value={`${chargesMois.toLocaleString("fr-FR")} DH`}
              trend="ce mois"
              borderColor="#F59E0B"
              icon="📊"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {/* Bar chart — encaissements 6 mois */}
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>
                  Encaissements
                </h2>
                <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">6 derniers mois</span>
              </div>
              <svg viewBox="0 0 360 155" className="w-full" style={{ height: 155 }}>
                <defs>
                  <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {last6.map(({ label }, i) => {
                  const x = 20 + i * 55;
                  const raw = encaissParMois[i];
                  const h = Math.round((raw / maxBar) * 100);
                  const isLast = i === 5;
                  const kLabel = raw >= 1000 ? `${(raw / 1000).toFixed(1)}k` : String(raw);
                  return (
                    <g key={label}>
                      <rect x={x} y={155 - h - 20} width={38} height={h} rx={4}
                        fill={isLast ? "url(#barGreen)" : "url(#barBlue)"} />
                      <text x={x + 19} y={148} textAnchor="middle" fontSize={10} fill="#94A3B8">{label}</text>
                      {raw > 0 && (
                        <text x={x + 19} y={155 - h - 25} textAnchor="middle" fontSize={9} fill="#64748B">{kLabel}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Donut chart — répartition charges */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
                Répartition charges
              </h2>
              {totalChargesPaye === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
                  Aucune charge payée
                </div>
              ) : (
                <>
                  <svg viewBox="0 0 144 144" className="w-full" style={{ height: 120 }}>
                    <circle cx="72" cy="72" r="52" fill="none" stroke="#F1F5F9" strokeWidth="18" />
                    {donutSegments.map(seg => (
                      <circle key={seg.type} cx="72" cy="72" r="52" fill="none"
                        stroke={CHARGE_COLORS[seg.type] ?? "#94A3B8"} strokeWidth="18"
                        strokeDasharray={`${seg.arc} 326.73`}
                        strokeDashoffset={-seg.offset}
                        transform="rotate(-90 72 72)"
                      />
                    ))}
                    <text x="72" y="76" textAnchor="middle" fontSize={12} fontWeight={700} fill="#1E293B">
                      {totalChargesPaye.toLocaleString("fr-FR")}
                    </text>
                    <text x="72" y="88" textAnchor="middle" fontSize={8} fill="#94A3B8">DH</text>
                  </svg>
                  <div className="space-y-1.5 mt-3">
                    {donutSegments.slice(0, 5).map(seg => (
                      <div key={seg.type} className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: CHARGE_COLORS[seg.type] ?? "#94A3B8" }} />
                        <span className="flex-1 capitalize">{seg.type}</span>
                        <span className="font-medium">{Math.round((seg.montant / totalChargesPaye) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tables row */}
          <div className="grid grid-cols-2 gap-5">
            {/* Derniers loyers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
                Derniers loyers
              </h2>
              {derniersLoyers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">Aucun loyer enregistré</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-slate-400 font-medium pb-2">Locataire</th>
                      <th className="text-left text-slate-400 font-medium pb-2">Montant</th>
                      <th className="text-left text-slate-400 font-medium pb-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {derniersLoyers.map(l => {
                      const { color, label } = STATUT_CONFIG[l.statut] ?? { color: "#94A3B8", label: l.statut };
                      return (
                        <tr key={l.id}>
                          <td className="py-3 text-slate-700 font-medium truncate max-w-[120px]">
                            {l.locataire_nom ?? l.bien_nom ?? "—"}
                          </td>
                          <td className="py-3 text-slate-600">{l.montant.toLocaleString("fr-FR")} DH</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: color + "18", color }}>
                              {label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Alertes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
                Alertes & Échéances
              </h2>
              <div className="space-y-3">
                {alertes.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: a.color + "0D" }}>
                    <span className="text-lg">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{a.msg}</p>
                      {a.date && (
                        <p className="text-xs mt-0.5" style={{ color: a.color }}>{a.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const STATUT_CONFIG: Record<string, { color: string; label: string }> = {
  paye:       { color: "#10B981", label: "Payé" },
  en_attente: { color: "#2563EB", label: "En attente" },
  retard:     { color: "#EF4444", label: "En retard" },
  partiel:    { color: "#F59E0B", label: "Partiel" },
};

function KpiCard({
  label, value, trend, trendUp, borderColor, icon,
}: {
  label: string; value: string; trend: string; trendUp?: boolean; borderColor: string; icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden"
      style={{ borderBottom: `3px solid ${borderColor}` }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>{value}</p>
      {trend && (
        <p className="text-xs mt-1.5 font-medium"
          style={{ color: trendUp === undefined ? "#64748B" : trendUp ? "#10B981" : "#EF4444" }}>
          {trendUp === true ? "↑ " : trendUp === false ? "↓ " : ""}{trend}
        </p>
      )}
    </div>
  );
}
