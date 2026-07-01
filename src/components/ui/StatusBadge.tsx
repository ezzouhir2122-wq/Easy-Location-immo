const BIEN_STATUT: Record<string, { label: string; color: string; bg: string }> = {
  libre:      { label: "Libre",       color: "#10B981", bg: "#D1FAE5" },
  occupe:     { label: "Occupé",      color: "#2563EB", bg: "#DBEAFE" },
  en_travaux: { label: "En travaux",  color: "#F59E0B", bg: "#FEF3C7" },
  a_vendre:   { label: "À vendre",    color: "#EF4444", bg: "#FEE2E2" },
};

export function BienStatusBadge({ statut }: { statut: string }) {
  const s = BIEN_STATUT[statut] ?? { label: statut, color: "#64748B", bg: "#F1F5F9" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ color: s.color, backgroundColor: s.bg }}
    >
      {s.label}
    </span>
  );
}

export function DpeBadge({ dpe }: { dpe: string }) {
  const colors: Record<string, string> = {
    A: "#059669", B: "#10B981", C: "#84CC16", D: "#EAB308",
    E: "#F97316", F: "#EF4444", G: "#991B1B",
  };
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-bold"
      style={{ backgroundColor: colors[dpe] ?? "#94A3B8" }}
    >
      {dpe}
    </span>
  );
}
