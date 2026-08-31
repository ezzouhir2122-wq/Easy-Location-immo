"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLoyers, Loyer } from "@/lib/supabase/loyers";
import { getCharges, Charge } from "@/lib/supabase/charges";
import { getContrats, Contrat } from "@/lib/supabase/contrats";

const money = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} DH`;
const pct = (n: number) => `${Math.round(n)}%`;

const MOIS_COURTS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function diffDays(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

export default function DashboardPage() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loyers, setLoyers] = useState<Loyer[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBiens(), getLoyers(), getCharges(), getContrats()])
      .then(([b, l, c, co]) => { setBiens(b); setLoyers(l); setCharges(c); setContrats(co); })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const thisMonth = monthKey(now);

  /* ── KPIs ─────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const totalBiens = biens.length;
    const occupes = biens.filter(b => b.statut === "occupe").length;
    const tauxOccupation = totalBiens > 0 ? (occupes / totalBiens) * 100 : 0;

    const loyersMois = loyers.filter(l => l.date_echeance?.startsWith(thisMonth));
    const encaissesMois = loyersMois.filter(l => l.statut === "paye").reduce((s, l) => s + l.montant, 0);
    const attendusMois = loyersMois.reduce((s, l) => s + l.montant, 0);
    const tauxEncaissement = attendusMois > 0 ? (encaissesMois / attendusMois) * 100 : 0;

    const enRetard = loyers.filter(l => l.statut === "retard");
    const montantRetard = enRetard.reduce((s, l) => s + l.montant, 0);

    const chargesMois = charges.filter(c => c.date?.startsWith(thisMonth)).reduce((s, c) => s + c.montant, 0);

    return { totalBiens, occupes, tauxOccupation, encaissesMois, attendusMois, tauxEncaissement, nbRetard: enRetard.length, montantRetard, chargesMois };
  }, [biens, loyers, charges, thisMonth]);

  /* ── Graphique 6 mois ─────────────────────────────────────────── */
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => addMonths(now, i - 5));
    return months.map(m => {
      const key = monthKey(m);
      const revenus = loyers.filter(l => l.statut === "paye" && l.date_paiement?.startsWith(key)).reduce((s, l) => s + l.montant, 0);
      const dep = charges.filter(c => c.statut === "paye" && c.date?.startsWith(key)).reduce((s, c) => s + c.montant, 0);
      return { label: MOIS_COURTS[m.getMonth()], revenus, charges: dep, resultat: revenus - dep };
    });
  }, [loyers, charges]);

  const maxVal = Math.max(...chartData.map(d => Math.max(d.revenus, d.charges)), 1);

  /* ── Alertes réelles ──────────────────────────────────────────── */
  const alertes = useMemo(() => {
    const list: { id: string; type: "retard" | "contrat" | "libre"; label: string; sub: string; urgence: "haute" | "moyenne" | "faible"; href: string }[] = [];

    // Loyers en retard
    loyers.filter(l => l.statut === "retard").slice(0, 3).forEach(l => {
      list.push({ id: `r-${l.id}`, type: "retard", label: `Loyer en retard — ${l.bien_nom ?? "Bien"}`, sub: `${money(l.montant)} · Échéance ${new Date(l.date_echeance).toLocaleDateString("fr-FR")}`, urgence: "haute", href: "/loyers" });
    });

    // Contrats expirant dans 60 jours
    contrats.filter(c => c.statut === "actif" && c.date_fin).forEach(c => {
      const days = diffDays(now, new Date(c.date_fin!));
      if (days >= 0 && days <= 60) {
        list.push({ id: `c-${c.id}`, type: "contrat", label: `Contrat expire bientôt — ${c.bien_nom ?? "Bien"}`, sub: `${c.locataire_nom ?? ""} · Dans ${days} jour${days > 1 ? "s" : ""}`, urgence: days < 14 ? "haute" : "moyenne", href: "/contrats" });
      }
    });

    // Biens libres
    biens.filter(b => b.statut === "libre").slice(0, 2).forEach(b => {
      list.push({ id: `b-${b.id}`, type: "libre", label: `Bien vacant — ${b.nom}`, sub: `${b.ville} · Loyer base ${money(b.loyer_base)}`, urgence: "faible", href: `/biens/${b.id}` });
    });

    return list.sort((a, b) => ({ haute: 0, moyenne: 1, faible: 2 }[a.urgence] - { haute: 0, moyenne: 1, faible: 2 }[b.urgence]));
  }, [loyers, contrats, biens]);

  const urgenceStyle = { haute: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" }, moyenne: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" }, faible: { bg: "#F0FDF4", text: "#16A34A", dot: "#22C55E" } };

  if (loading) return (
    <div className="p-8 space-y-4">
      <div className="h-8 w-64 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Tableau de bord</h1>
        <p className="text-slate-400 text-sm mt-1">{now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <KpiCard
          label="Taux d'occupation"
          value={pct(kpis.tauxOccupation)}
          sub={`${kpis.occupes} / ${kpis.totalBiens} biens`}
          color="#2563EB"
          bar={kpis.tauxOccupation}
          href="/biens"
        />
        <KpiCard
          label="Revenus du mois"
          value={money(kpis.encaissesMois)}
          sub={`sur ${money(kpis.attendusMois)} attendus (${pct(kpis.tauxEncaissement)})`}
          color="#10B981"
          bar={kpis.tauxEncaissement}
          href="/loyers"
        />
        <KpiCard
          label="Loyers en retard"
          value={money(kpis.montantRetard)}
          sub={`${kpis.nbRetard} paiement${kpis.nbRetard > 1 ? "s" : ""} en retard`}
          color={kpis.nbRetard > 0 ? "#EF4444" : "#10B981"}
          href="/loyers"
        />
        <KpiCard
          label="Charges du mois"
          value={money(kpis.chargesMois)}
          sub="charges payées ce mois"
          color="#8B5CF6"
          href="/charges"
        />
      </div>

      {/* Graphique + Alertes */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* Graphique revenus / charges 6 mois */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>Revenus & Charges</h2>
              <p className="text-xs text-slate-400 mt-0.5">6 derniers mois</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />Revenus</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Charges</span>
            </div>
          </div>

          {/* Barres SVG */}
          <div className="flex items-end gap-2 h-44">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5 h-36">
                  <div
                    className="flex-1 rounded-t-md bg-blue-500 transition-all"
                    style={{ height: `${(d.revenus / maxVal) * 100}%`, minHeight: d.revenus > 0 ? 4 : 0 }}
                    title={`Revenus : ${money(d.revenus)}`}
                  />
                  <div
                    className="flex-1 rounded-t-md bg-amber-400 transition-all"
                    style={{ height: `${(d.charges / maxVal) * 100}%`, minHeight: d.charges > 0 ? 4 : 0 }}
                    title={`Charges : ${money(d.charges)}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
              </div>
            ))}
          </div>

          {/* Résultats */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            {[
              { label: "Revenus 6 mois", val: chartData.reduce((s, d) => s + d.revenus, 0), color: "#2563EB" },
              { label: "Charges 6 mois", val: chartData.reduce((s, d) => s + d.charges, 0), color: "#F59E0B" },
              { label: "Résultat net", val: chartData.reduce((s, d) => s + d.resultat, 0), color: "#10B981" },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color }}>{money(val)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Alertes & Actions</h2>
            {alertes.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">{alertes.length}</span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {alertes.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center px-5">
                <span className="text-3xl mb-3">✅</span>
                <p className="font-semibold text-slate-700 text-sm">Tout est en ordre</p>
                <p className="text-xs text-slate-400 mt-1">Aucune alerte active pour le moment</p>
              </div>
            ) : alertes.map(a => {
              const s = urgenceStyle[a.urgence];
              return (
                <Link key={a.id} href={a.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: s.dot }} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{a.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{a.sub}</p>
                  </div>
                  <span className="ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: s.bg, color: s.text }}>
                    {a.urgence === "haute" ? "Urgent" : a.urgence === "moyenne" ? "À faire" : "Info"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accès rapides */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { href: "/biens", emoji: "🏠", label: "Biens", count: biens.length },
          { href: "/loyers", emoji: "💰", label: "Loyers", count: loyers.filter(l => l.statut === "en_attente").length + " en attente" },
          { href: "/charges", emoji: "📋", label: "Charges", count: charges.filter(c => c.statut === "en_attente").length + " en attente" },
          { href: "/contrats", emoji: "📄", label: "Contrats", count: contrats.filter(c => c.statut === "actif").length + " actifs" },
        ].map(({ href, emoji, label, count }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{label}</p>
              <p className="text-xs text-slate-400">{count}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, bar, href }: { label: string; value: string; sub: string; color: string; bar?: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow block">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
      {bar !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-100">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(bar, 100)}%`, background: color }} />
        </div>
      )}
    </Link>
  );
}
