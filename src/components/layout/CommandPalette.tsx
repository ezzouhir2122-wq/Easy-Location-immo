"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getBiens } from "@/lib/supabase/biens";
import { getLocataires } from "@/lib/supabase/locataires";
import { getContrats } from "@/lib/supabase/contrats";

type Result = { id: string; label: string; sub: string; icon: string; href: string; category: string };

const SHORTCUTS = [
  { label: "Tableau de bord", icon: "📊", href: "/dashboard", sub: "Vue générale" },
  { label: "Biens", icon: "🏠", href: "/biens", sub: "Liste des biens" },
  { label: "Locataires", icon: "👤", href: "/locataires", sub: "Liste des locataires" },
  { label: "Contrats", icon: "📄", href: "/contrats", sub: "Gestion des baux" },
  { label: "Loyers", icon: "💰", href: "/loyers", sub: "Paiements et encaissements" },
  { label: "Charges", icon: "📋", href: "/charges", sub: "Dépenses par bien" },
  { label: "Documents", icon: "📁", href: "/documents", sub: "Fichiers et modèles" },
  { label: "Paramètres", icon: "⚙️", href: "/parametres", sub: "Profil propriétaire" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Ouvrir avec Ctrl+K ou Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [biens, locataires, contrats] = await Promise.all([getBiens(), getLocataires(), getContrats()]);
      const lower = q.toLowerCase();
      const r: Result[] = [
        ...biens.filter(b => b.nom.toLowerCase().includes(lower) || b.ville.toLowerCase().includes(lower))
          .map(b => ({ id: b.id, label: b.nom, sub: `${b.ville} · ${b.type}`, icon: "🏠", href: `/biens/${b.id}`, category: "Biens" })),
        ...locataires.filter(l => `${l.prenom} ${l.nom}`.toLowerCase().includes(lower) || l.email?.toLowerCase().includes(lower))
          .map(l => ({ id: l.id, label: `${l.prenom} ${l.nom}`, sub: l.email ?? "", icon: "👤", href: `/locataires/${l.id}`, category: "Locataires" })),
        ...contrats.filter(c => c.bien_nom?.toLowerCase().includes(lower) || c.locataire_nom?.toLowerCase().includes(lower))
          .map(c => ({ id: c.id, label: c.locataire_nom ?? "Contrat", sub: c.bien_nom ?? "", icon: "📄", href: `/contrats`, category: "Contrats" })),
      ];
      setResults(r.slice(0, 8));
      setCursor(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  const displayed = query.trim() ? results : SHORTCUTS.map(s => ({ ...s, id: s.href, category: "Navigation" }));

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, displayed.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && displayed[cursor]) go(displayed[cursor].href);
  }

  if (!open) return null;

  // Grouper par catégorie
  const groups: Record<string, (Result | typeof SHORTCUTS[0] & { id: string; category: string })[]> = {};
  displayed.forEach(r => { if (!groups[r.category]) groups[r.category] = []; groups[r.category].push(r as any); });

  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200" onClick={e => e.stopPropagation()}>

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <span className="text-slate-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un bien, locataire, contrat…"
            className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none"
          />
          {loading && <span className="text-xs text-slate-400 animate-pulse">Recherche…</span>}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">Échap</kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-80 overflow-y-auto py-2">
          {displayed.length === 0 && !loading && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">Aucun résultat pour "{query}"</p>
          )}
          {Object.entries(groups).map(([cat, items]) => (
            <div key={cat}>
              <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">{cat}</p>
              {items.map(item => {
                const idx = globalIdx++;
                const active = idx === cursor;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setCursor(idx)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: active ? "#EFF6FF" : "transparent" }}
                  >
                    <span className="text-lg w-7 text-center flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                      <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                    </div>
                    {active && <span className="ml-auto text-[10px] text-slate-400 flex-shrink-0">Entrée ↵</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-400">
          <span><kbd className="rounded border border-slate-200 px-1">↑↓</kbd> naviguer</span>
          <span><kbd className="rounded border border-slate-200 px-1">↵</kbd> ouvrir</span>
          <span><kbd className="rounded border border-slate-200 px-1">Échap</kbd> fermer</span>
          <span className="ml-auto">Ctrl+K pour ouvrir</span>
        </div>
      </div>
    </div>
  );
}
