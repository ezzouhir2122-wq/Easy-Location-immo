"use client";
import { useEffect, useState, useCallback } from "react";
import { Loyer, getLoyers, deleteLoyer, createLoyer, updateLoyer, getLoyersByYear } from "@/lib/supabase/loyers";
import { getBiens, Bien } from "@/lib/supabase/biens";
import LoyerForm from "@/components/loyers/LoyerForm";
import LoyerStatusBadge from "@/components/loyers/LoyerStatusBadge";
import SlideOver from "@/components/ui/SlideOver";
import Toast from "@/components/ui/Toast";
import { exportToExcel } from "@/lib/export/excel";

// ─── Constantes vue mensuelle ─────────────────────────────────────────────────

const MOIS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]

function lastDayISO(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().split("T")[0]
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function isEchu(year: number, month: number): boolean {
  return new Date(year, month + 1, 0) < new Date()
}

function findLoyerDuMois(loyers: Loyer[], bienId: string, year: number, month: number): Loyer | undefined {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`
  return loyers.find(
    (l) => l.bien_id === bienId && l.type === "loyer" && l.date_echeance.startsWith(prefix)
  )
}

// ─── Composant grille mensuelle ───────────────────────────────────────────────

type VueMensuelleProps = {
  biens: Bien[]
  loyers: Loyer[]
  annee: number
  toggling: Set<string>
  onSelect: (bien: Bien, month: number, existing: Loyer | undefined) => void
}

function VueMensuelle({ biens, loyers, annee, toggling, onSelect }: VueMensuelleProps) {
  const biensFiltres = biens.filter((b) => b.loyer_base > 0)

  if (biensFiltres.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <span className="text-4xl mb-4">🏠</span>
        <p className="text-slate-500 font-medium">Aucun bien avec loyer configuré</p>
        <p className="text-slate-400 text-sm mt-1">Définissez un loyer de base sur vos biens pour les afficher ici</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {biensFiltres.map((bien) => {
        const totalPaye = MOIS.reduce((acc, _, m) => {
          const l = findLoyerDuMois(loyers, bien.id, annee, m)
          return l?.statut === "paye" ? acc + 1 : acc
        }, 0)

        return (
          <div key={bien.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            {/* En-tête bien */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{bien.nom}</p>
                  <p className="text-xs text-slate-400">{bien.adresse}, {bien.ville}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {totalPaye}/12 mois payés
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {bien.loyer_base.toLocaleString("fr-FR")} DH/mois
                </span>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(totalPaye / 12) * 100}%` }}
              />
            </div>

            {/* Grille des 12 mois */}
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {MOIS.map((moisLabel, m) => {
                const loyer = findLoyerDuMois(loyers, bien.id, annee, m)
                const paye = loyer?.statut === "paye"
                const echu = isEchu(annee, m)
                const key = `${bien.id}-${m}`
                const isToggling = toggling.has(key)

                let cellBg = "bg-slate-50 border-slate-200 text-slate-400"
                let icon = "○"

                if (paye) {
                  cellBg = "bg-emerald-50 border-emerald-200 text-emerald-700"
                  icon = "✓"
                } else if (echu) {
                  cellBg = "bg-red-50 border-red-200 text-red-500"
                  icon = "○"
                }

                return (
                  <button
                    key={m}
                    onClick={() => onSelect(bien, m, loyer)}
                    disabled={isToggling}
                    title={
                      paye
                        ? `${moisLabel} — payé · cliquer pour annuler`
                        : echu
                        ? `${moisLabel} — en retard · cliquer pour marquer payé`
                        : `${moisLabel} — en attente · cliquer pour marquer payé`
                    }
                    className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all
                      ${cellBg}
                      ${isToggling ? "opacity-50 cursor-wait" : "hover:scale-105 hover:shadow-sm cursor-pointer"}
                    `}
                  >
                    <span className="text-[10px] font-medium opacity-70">{moisLabel}</span>
                    <span className="text-base leading-none">{icon}</span>
                    {isToggling && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
                        <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Résumé financier */}
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>
                Encaissé : <strong className="text-emerald-600">
                  {(totalPaye * bien.loyer_base).toLocaleString("fr-FR")} DH
                </strong>
              </span>
              <span>
                Restant : <strong className="text-slate-500">
                  {((12 - totalPaye) * bien.loyer_base).toLocaleString("fr-FR")} DH
                </strong>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Constantes vue liste ─────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  loyer: "Loyer",
  charge: "Charge",
  depot_garantie: "Dépôt",
  autre: "Autre",
};

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LoyersPage() {
  const [vue, setVue] = useState<"liste" | "mensuelle">("mensuelle")
  const [annee, setAnnee] = useState(new Date().getFullYear())

  // Vue liste
  const [loyers, setLoyers] = useState<Loyer[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Loyer | undefined>(undefined)
  const [filterStatut, setFilterStatut] = useState<string>("tous")
  const [filterBien, setFilterBien] = useState<string>("tous")

  // Vue mensuelle
  const [biens, setBiens] = useState<Bien[]>([])
  const [loyersMensuels, setLoyersMensuels] = useState<Loyer[]>([])
  const [loadingMensuel, setLoadingMensuel] = useState(false)
  const [toggling, setToggling] = useState<Set<string>>(new Set())
  const [pendingToggle, setPendingToggle] = useState<{
    bien: Bien; month: number; existing: Loyer | undefined
  } | null>(null)

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Chargement liste classique
  async function loadLoyers() {
    setLoading(true)
    try { setLoyers(await getLoyers()) }
    catch { setToast({ message: "Erreur de chargement", type: "error" }) }
    finally { setLoading(false) }
  }

  // Chargement vue mensuelle
  const loadMensuel = useCallback(async () => {
    setLoadingMensuel(true)
    try {
      const [b, l] = await Promise.all([getBiens(), getLoyersByYear(annee)])
      setBiens(b)
      setLoyersMensuels(l)
    } catch {
      setToast({ message: "Erreur de chargement", type: "error" })
    } finally {
      setLoadingMensuel(false)
    }
  }, [annee])

  useEffect(() => { loadLoyers() }, [])
  useEffect(() => { loadMensuel() }, [loadMensuel])

  function handleAdd() { setEditTarget(undefined); setFormOpen(true) }
  function handleEdit(l: Loyer) { setEditTarget(l); setFormOpen(true) }

  async function handleDelete(l: Loyer) {
    if (!confirm(`Supprimer ce paiement de ${l.montant} DH ?`)) return
    try {
      await deleteLoyer(l.id)
      setLoyers(prev => prev.filter(x => x.id !== l.id))
      setToast({ message: "Paiement supprimé", type: "success" })
    } catch {
      setToast({ message: "Erreur lors de la suppression", type: "error" })
    }
  }

  function handleSuccess(l: Loyer) {
    setFormOpen(false)
    setLoyers(prev => {
      const idx = prev.findIndex(x => x.id === l.id)
      return idx >= 0 ? prev.map((x, i) => i === idx ? l : x) : [l, ...prev]
    })
    setToast({ message: editTarget ? "Paiement mis à jour" : "Paiement enregistré", type: "success" })
    setEditTarget(undefined)
    if (vue === "mensuelle") loadMensuel()
  }

  // Toggle mois dans la vue mensuelle
  async function handleToggleMonth(bien: Bien, month: number, existing: Loyer | undefined) {
    const key = `${bien.id}-${month}`
    setToggling(prev => new Set(prev).add(key))
    try {
      if (existing?.statut === "paye") {
        // Décocher → repasser en attente
        const updated = await updateLoyer(existing.id, {
          statut: "en_attente",
          date_paiement: null,
        })
        setLoyersMensuels(prev => prev.map(l => l.id === updated.id ? { ...l, statut: updated.statut, date_paiement: null } : l))
        setToast({ message: `${MOIS[month]} — marqué en attente`, type: "success" })
      } else if (existing) {
        // Loyer existe mais non payé → marquer payé
        const updated = await updateLoyer(existing.id, {
          statut: "paye",
          date_paiement: todayISO(),
        })
        setLoyersMensuels(prev => prev.map(l => l.id === updated.id ? { ...l, statut: updated.statut, date_paiement: updated.date_paiement } : l))
        setToast({ message: `${MOIS[month]} — paiement enregistré`, type: "success" })
      } else {
        // Pas encore de loyer → créer
        const created = await createLoyer({
          bien_id: bien.id,
          locataire_id: null,
          montant: bien.loyer_base,
          date_echeance: lastDayISO(annee, month),
          date_paiement: todayISO(),
          statut: "paye",
          type: "loyer",
          notes: "",
        })
        setLoyersMensuels(prev => [...prev, created])
        setToast({ message: `${MOIS[month]} — paiement enregistré`, type: "success" })
      }
    } catch {
      setToast({ message: "Erreur lors de la mise à jour", type: "error" })
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  const filtered = loyers.filter(l =>
    (filterStatut === "tous" || l.statut === filterStatut) &&
    (filterBien === "tous" || l.bien_id === filterBien)
  )
  const totalPaye = loyers.filter(l => l.statut === "paye").reduce((s, l) => s + l.montant, 0)
  const totalAttente = loyers.filter(l => l.statut === "en_attente").reduce((s, l) => s + l.montant, 0)
  const totalRetard = loyers.filter(l => l.statut === "retard").reduce((s, l) => s + l.montant, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            Loyers
          </h1>
          <p className="text-slate-500 text-sm mt-1">Suivi des paiements et encaissements</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle vue */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {(["mensuelle", "liste"] as const).map(v => (
              <button
                key={v}
                onClick={() => setVue(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  vue === v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v === "mensuelle" ? "Vue mensuelle" : "Vue liste"}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              const rows = filtered.map(l => ({
                "Bien": l.bien_nom ?? "",
                "Locataire": l.locataire_nom ?? "",
                "Montant (DH)": l.montant,
                "Échéance": l.date_echeance,
                "Paiement": l.date_paiement ?? "",
                "Statut": { paye: "Payé", en_attente: "En attente", retard: "En retard", partiel: "Partiel" }[l.statut] ?? l.statut,
                "Type": l.type,
                "Notes": l.notes ?? "",
              }));
              exportToExcel(rows, `loyers_${new Date().toISOString().slice(0,10)}`, "Loyers");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            ⬇ Export Excel
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
            style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
          >
            + Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* ── VUE MENSUELLE ────────────────────────────────────────────────────── */}
      {vue === "mensuelle" && (
        <>
          {/* Sélecteur année */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setAnnee(a => a - 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center"
            >‹</button>
            <span className="text-base font-bold text-slate-800 w-16 text-center">{annee}</span>
            <button
              onClick={() => setAnnee(a => a + 1)}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center"
            >›</button>
            <span className="text-xs text-slate-400 ml-2">
              Cocher un mois = loyer encaissé · Décocher = remettre en attente
            </span>
            {loadingMensuel && (
              <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin ml-2" />
            )}
          </div>

          {/* Filtre bien vue mensuelle */}
          <div className="mb-4">
            <select
              value={filterBien}
              onChange={e => setFilterBien(e.target.value)}
              className="input mt-0 w-auto text-xs py-1.5"
            >
              <option value="tous">Tous les biens</option>
              {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </select>
          </div>

          <VueMensuelle
            biens={filterBien === "tous" ? biens : biens.filter(b => b.id === filterBien)}
            loyers={loyersMensuels}
            annee={annee}
            toggling={toggling}
            onSelect={(bien, month, existing) => setPendingToggle({ bien, month, existing })}
          />
        </>
      )}

      {/* ── VUE LISTE ─────────────────────────────────────────────────────────── */}
      {vue === "liste" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Encaissé", value: totalPaye, color: "#10B981", bg: "#D1FAE5" },
              { label: "En attente", value: totalAttente, color: "#2563EB", bg: "#DBEAFE" },
              { label: "En retard", value: totalRetard, color: "#EF4444", bg: "#FEE2E2" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold" style={{ color, fontFamily: "Syne, sans-serif" }}>
                  {value.toLocaleString("fr-FR")} DH
                </p>
              </div>
            ))}
          </div>

          {/* Filtres statut + bien */}
          <div className="flex flex-wrap gap-2 mb-5 items-center">
            {["tous", "paye", "en_attente", "retard", "partiel"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                style={{
                  background: filterStatut === s ? "#0B1A2F" : "#F1F5F9",
                  color: filterStatut === s ? "#fff" : "#64748B",
                }}
              >
                {s === "tous" ? "Tous statuts" : s === "paye" ? "Payés" : s === "en_attente" ? "En attente" : s === "retard" ? "Retard" : "Partiel"}
              </button>
            ))}
            <div className="ml-auto">
              <select
                value={filterBien}
                onChange={e => setFilterBien(e.target.value)}
                className="input mt-0 w-auto text-xs py-1.5"
              >
                <option value="tous">Tous les biens</option>
                {biens.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
              </select>
            </div>
          </div>

          {/* Tableau */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl h-14 animate-pulse" style={{ background: "#F1F5F9" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-slate-700 font-semibold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
                {filterStatut === "tous" ? "Aucun paiement enregistré" : "Aucun paiement dans cette catégorie"}
              </h3>
              <p className="text-slate-400 text-sm mb-6">Enregistrez les loyers perçus pour suivre vos encaissements</p>
              {filterStatut === "tous" && (
                <button
                  onClick={handleAdd}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
                >
                  + Enregistrer un paiement
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Bien</th>
                    <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Locataire</th>
                    <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Type</th>
                    <th className="text-right text-xs font-semibold text-slate-400 px-5 py-3">Montant</th>
                    <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Échéance</th>
                    <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Paiement</th>
                    <th className="text-left text-xs font-semibold text-slate-400 px-5 py-3">Statut</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l, i) => (
                    <tr
                      key={l.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition"
                      style={{ borderBottom: i === filtered.length - 1 ? "none" : undefined }}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-800">{l.bien_nom ?? "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600">{l.locataire_nom ?? "—"}</td>
                      <td className="px-5 py-3.5 text-slate-500">{TYPE_LABELS[l.type] ?? l.type}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800">
                        {l.montant.toLocaleString("fr-FR")} DH
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {new Date(l.date_echeance).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {l.date_paiement ? new Date(l.date_paiement).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <LoyerStatusBadge statut={l.statut} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(l)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(l)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(undefined) }}
        title={editTarget ? "Modifier le paiement" : "Enregistrer un paiement"}
      >
        <LoyerForm
          loyer={editTarget}
          onSuccess={handleSuccess}
          onError={msg => setToast({ message: msg, type: "error" })}
        />
      </SlideOver>

      {/* Modal confirmation paiement mensuel */}
      {pendingToggle && (() => {
        const { bien, month, existing } = pendingToggle
        const isPaye = existing?.statut === "paye"
        const action = isPaye ? "annuler" : "confirmer"
        const montant = existing?.montant ?? bien.loyer_base

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setPendingToggle(null)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
              {/* Icône */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isPaye ? "bg-amber-50" : "bg-emerald-50"
              }`}>
                <span className="text-2xl">{isPaye ? "↩" : "✓"}</span>
              </div>

              {/* Titre */}
              <h3 className="text-base font-bold text-slate-800 text-center mb-1">
                {isPaye ? "Annuler ce paiement ?" : "Valider le paiement"}
              </h3>
              <p className="text-xs text-slate-400 text-center mb-5">
                {isPaye
                  ? "Le mois sera remis en statut « En attente »"
                  : "Le loyer sera enregistré comme encaissé"}
              </p>

              {/* Détails */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Bien</span>
                  <span className="font-semibold text-slate-800">{bien.nom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Mois</span>
                  <span className="font-semibold text-slate-800">{MOIS[month]} {pendingToggle ? annee : ""}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Montant</span>
                  <span className="font-bold text-blue-700">{montant.toLocaleString("fr-FR")} DH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Échéance</span>
                  <span className="text-slate-600">
                    {new Date(lastDayISO(annee, month)).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                {!isPaye && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Date encaissement</span>
                    <span className="text-slate-600">
                      {new Date().toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingToggle(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    setPendingToggle(null)
                    await handleToggleMonth(bien, month, existing)
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${
                    isPaye
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {isPaye ? "Oui, annuler" : `Valider — ${action === "confirmer" ? montant.toLocaleString("fr-FR") + " DH" : ""}`}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
