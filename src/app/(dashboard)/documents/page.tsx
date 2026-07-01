export default function DocumentsPage() {
  const categories = [
    { icon: "📄", label: "Contrats de bail", count: 0, color: "#DBEAFE", text: "#1E40AF" },
    { icon: "🪪", label: "Pièces d'identité", count: 0, color: "#EDE9FE", text: "#5B21B6" },
    { icon: "💼", label: "Justificatifs de revenus", count: 0, color: "#D1FAE5", text: "#065F46" },
    { icon: "🏠", label: "Titres de propriété", count: 0, color: "#FEF3C7", text: "#92400E" },
    { icon: "🛡️", label: "Assurances", count: 0, color: "#FCE7F3", text: "#9D174D" },
    { icon: "📋", label: "États des lieux", count: 0, color: "#FEE2E2", text: "#991B1B" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Documents</h1>
          <p className="text-slate-500 text-sm mt-1">Contrats, pièces d&apos;identité, justificatifs</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {categories.map(cat => (
          <div key={cat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: cat.color, color: cat.text }}>
                {cat.count} doc{cat.count > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700">{cat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="text-5xl mb-4">☁️</div>
        <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
          Stockage de documents
        </h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          L&apos;upload et la gestion des documents seront disponibles prochainement. Vos fichiers seront stockés de manière sécurisée.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 bg-slate-50 border border-slate-200">
          🔒 Stockage sécurisé — Bientôt disponible
        </div>
      </div>
    </div>
  );
}
