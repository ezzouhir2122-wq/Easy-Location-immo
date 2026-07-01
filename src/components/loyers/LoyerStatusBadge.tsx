type Statut = 'paye' | 'en_attente' | 'retard' | 'partiel';

const CONFIG: Record<Statut, { label: string; bg: string; color: string }> = {
  paye:       { label: "Payé",       bg: "#D1FAE5", color: "#065F46" },
  en_attente: { label: "En attente", bg: "#DBEAFE", color: "#1E40AF" },
  retard:     { label: "Retard",     bg: "#FEE2E2", color: "#991B1B" },
  partiel:    { label: "Partiel",    bg: "#FEF3C7", color: "#92400E" },
};

export default function LoyerStatusBadge({ statut }: { statut: Statut }) {
  const c = CONFIG[statut];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}
