export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
          Tableau de bord
        </h1>
        <p className="text-slate-500 text-sm mt-1">Vue d&apos;ensemble de votre portefeuille — Juin 2026</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <KpiCard
          label="Loyers encaissés"
          value="12 540 €"
          trend="+3.2%"
          trendUp
          borderColor="#10B981"
          icon="💶"
        />
        <KpiCard
          label="En retard"
          value="1 250 €"
          trend="1 locataire"
          borderColor="#EF4444"
          icon="⚠️"
        />
        <KpiCard
          label="Biens gérés"
          value="8"
          trend="6 occupés"
          borderColor="#2563EB"
          icon="🏠"
        />
        <KpiCard
          label="Charges du mois"
          value="890 €"
          trend="-5.1%"
          trendUp={false}
          borderColor="#F59E0B"
          icon="📊"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Bar chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>
              Encaissements
            </h2>
            <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">6 derniers mois</span>
          </div>
          <svg viewBox="0 0 360 155" className="w-full" style={{ height: 155 }}>
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="ba" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {[
              { x: 20, h: 80, label: "Jan", v: "10.2k" },
              { x: 75, h: 95, label: "Fév", v: "11.5k" },
              { x: 130, h: 70, label: "Mar", v: "9.8k" },
              { x: 185, h: 105, label: "Avr", v: "12.1k" },
              { x: 240, h: 88, label: "Mai", v: "11.2k" },
              { x: 295, h: 120, label: "Jun", v: "12.5k", highlight: true },
            ].map((b) => (
              <g key={b.label}>
                <rect
                  x={b.x}
                  y={155 - b.h - 20}
                  width={38}
                  height={b.h}
                  rx={4}
                  fill={b.highlight ? "url(#ba)" : "url(#bg)"}
                />
                <text x={b.x + 19} y={148} textAnchor="middle" fontSize={10} fill="#94A3B8">
                  {b.label}
                </text>
                <text x={b.x + 19} y={155 - b.h - 25} textAnchor="middle" fontSize={9} fill="#64748B">
                  {b.v}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Répartition charges
          </h2>
          <svg viewBox="0 0 144 144" className="w-full" style={{ height: 120 }}>
            <circle cx="72" cy="72" r="52" fill="none" stroke="#F1F5F9" strokeWidth="18" />
            <circle cx="72" cy="72" r="52" fill="none" stroke="#2563EB" strokeWidth="18"
              strokeDasharray="130.7 326.73" transform="rotate(-90 72 72)" />
            <circle cx="72" cy="72" r="52" fill="none" stroke="#10B981" strokeWidth="18"
              strokeDasharray="81.68 326.73" strokeDashoffset="-130.7" transform="rotate(-90 72 72)" />
            <circle cx="72" cy="72" r="52" fill="none" stroke="#F59E0B" strokeWidth="18"
              strokeDasharray="49.01 326.73" strokeDashoffset="-212.38" transform="rotate(-90 72 72)" />
            <circle cx="72" cy="72" r="52" fill="none" stroke="#EF4444" strokeWidth="18"
              strokeDasharray="32.67 326.73" strokeDashoffset="-261.39" transform="rotate(-90 72 72)" />
            <circle cx="72" cy="72" r="52" fill="none" stroke="#8B5CF6" strokeWidth="18"
              strokeDasharray="32.67 326.73" strokeDashoffset="-294.06" transform="rotate(-90 72 72)" />
            <text x="72" y="76" textAnchor="middle" fontSize={13} fontWeight={700} fill="#1E293B">890€</text>
          </svg>
          <div className="space-y-1.5 mt-3">
            {[
              { label: "Eau / EDF", color: "#2563EB", pct: "40%" },
              { label: "Entretien", color: "#10B981", pct: "25%" },
              { label: "Taxe ordures", color: "#F59E0B", pct: "15%" },
              { label: "Assurance", color: "#EF4444", pct: "10%" },
              { label: "Autres", color: "#8B5CF6", pct: "10%" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="flex-1">{c.label}</span>
                <span className="font-medium">{c.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent payments */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Derniers loyers
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-slate-400 font-medium pb-2">Locataire</th>
                <th className="text-left text-slate-400 font-medium pb-2">Montant</th>
                <th className="text-left text-slate-400 font-medium pb-2">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { name: "M. Dupont", amount: "850 €", status: "Payé", color: "#10B981" },
                { name: "Mme. Martin", amount: "720 €", status: "Payé", color: "#10B981" },
                { name: "M. Bernard", amount: "1 200 €", status: "En retard", color: "#EF4444" },
                { name: "Mme. Durand", amount: "650 €", status: "Payé", color: "#10B981" },
              ].map((r) => (
                <tr key={r.name}>
                  <td className="py-3 text-slate-700 font-medium">{r.name}</td>
                  <td className="py-3 text-slate-600">{r.amount}</td>
                  <td className="py-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: r.color + "18",
                        color: r.color,
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-semibold text-slate-800 mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
            Alertes & Échéances
          </h2>
          <div className="space-y-3">
            {[
              { icon: "⚠️", msg: "Loyer impayé — M. Bernard", date: "Depuis 5 jours", color: "#EF4444" },
              { icon: "📋", msg: "Contrat à renouveler — Apt. 3B", date: "Dans 30 jours", color: "#F59E0B" },
              { icon: "🔧", msg: "Intervention plomberie planifiée", date: "15 Jul 2026", color: "#2563EB" },
              { icon: "📄", msg: "Quittance Juin à envoyer", date: "3 en attente", color: "#8B5CF6" },
            ].map((a) => (
              <div
                key={a.msg}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: a.color + "0D" }}
              >
                <span className="text-lg">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{a.msg}</p>
                  <p className="text-xs mt-0.5" style={{ color: a.color }}>
                    {a.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  trendUp,
  borderColor,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  trendUp?: boolean;
  borderColor: string;
  icon: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden"
      style={{ borderBottom: `3px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800" style={{ fontFamily: "Syne, sans-serif" }}>
        {value}
      </p>
      {trend && (
        <p
          className="text-xs mt-1.5 font-medium"
          style={{ color: trendUp === undefined ? "#64748B" : trendUp ? "#10B981" : "#EF4444" }}
        >
          {trendUp === true ? "↑ " : trendUp === false ? "↓ " : ""}{trend}
        </p>
      )}
    </div>
  );
}
