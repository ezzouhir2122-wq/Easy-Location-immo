"use client";
import { useEffect, useState } from "react";
import { getBiens, Bien } from "@/lib/supabase/biens";
import { getLocataires, Locataire } from "@/lib/supabase/locataires";
import { DocType } from "@/lib/supabase/documents-generes";
import { QuittanceData } from "./templates/QuittanceTemplate";
import { BailData } from "./templates/BailTemplate";
import { EtatDesLieuxData, PieceEtat } from "./templates/EtatDesLieuxTemplate";

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ANNEE_COURANTE = new Date().getFullYear();
const MOIS_OPTIONS = MOIS.flatMap(m => [ANNEE_COURANTE - 1, ANNEE_COURANTE, ANNEE_COURANTE + 1].map(y => `${m} ${y}`));

const PIECES_DEFAUT: PieceEtat[] = [
  { nom: "Salon", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "Chambre 1", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "Cuisine", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "Salle de bain", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
  { nom: "WC", murs: "", sols: "", plafond: "", fenetres: "", observations: "" },
];

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

type Props = {
  type: DocType;
  onPreview: (titre: string, data: Record<string, unknown>, bienId: string | null, locataireId: string | null) => void;
  onClose: () => void;
};

export default function DocumentGenerateur({ type, onPreview, onClose }: Props) {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [selectedBienId, setSelectedBienId] = useState("");
  const [selectedLocataireId, setSelectedLocataireId] = useState("");

  // Quittance state
  const [q, setQ] = useState<QuittanceData>({
    bailleur_nom: "", bailleur_adresse: "",
    locataire_nom: "", locataire_prenom: "",
    bien_adresse: "", bien_ville: "",
    mois: MOIS_OPTIONS[MOIS.indexOf("Janvier") + ANNEE_COURANTE % 3] || MOIS_OPTIONS[0],
    loyer: 0, charges: 0,
    date_paiement: new Date().toLocaleDateString("fr-FR"),
  });

  // Bail state
  const [b, setB] = useState<BailData>({
    type_bail: "vide", duree: "3_ans", duree_autre: "",
    date_debut: "", bailleur_nom: "", bailleur_adresse: "", bailleur_cin: "",
    locataire_nom: "", locataire_prenom: "", locataire_adresse: "",
    locataire_cin: "", locataire_profession: "",
    bien_adresse: "", bien_ville: "", bien_surface: 0, bien_description: "",
    loyer: 0, charges: 0, depot_garantie: 0, clauses_particulieres: "",
  });

  // État des lieux state
  const [e, setE] = useState<EtatDesLieuxData>({
    type_edl: "entree", date: new Date().toLocaleDateString("fr-FR"),
    bailleur_nom: "", locataire_nom: "", locataire_prenom: "",
    bien_adresse: "", bien_ville: "",
    compteur_eau: "", compteur_electricite: "", compteur_gaz: "",
    pieces: PIECES_DEFAUT,
  });

  useEffect(() => {
    getBiens().then(setBiens).catch(() => {});
    getLocataires().then(setLocataires).catch(() => {});
  }, []);

  // Pré-remplissage depuis sélection bien
  useEffect(() => {
    const bien = biens.find(x => x.id === selectedBienId);
    if (!bien) return;
    if (type === "quittance") setQ(prev => ({ ...prev, bien_adresse: bien.adresse, bien_ville: bien.ville, loyer: bien.loyer_base, charges: bien.charges }));
    if (type === "bail") setB(prev => ({ ...prev, bien_adresse: bien.adresse, bien_ville: bien.ville, bien_surface: bien.surface, bien_description: bien.description || "", loyer: bien.loyer_base, charges: bien.charges, depot_garantie: bien.depot_garantie }));
    if (type === "etat_des_lieux") setE(prev => ({ ...prev, bien_adresse: bien.adresse, bien_ville: bien.ville }));
  }, [selectedBienId, biens, type]);

  // Pré-remplissage depuis sélection locataire
  useEffect(() => {
    const loc = locataires.find(x => x.id === selectedLocataireId);
    if (!loc) return;
    if (type === "quittance") setQ(prev => ({ ...prev, locataire_nom: loc.nom, locataire_prenom: loc.prenom }));
    if (type === "bail") setB(prev => ({ ...prev, locataire_nom: loc.nom, locataire_prenom: loc.prenom, locataire_profession: loc.profession || "" }));
    if (type === "etat_des_lieux") setE(prev => ({ ...prev, locataire_nom: loc.nom, locataire_prenom: loc.prenom }));
  }, [selectedLocataireId, locataires, type]);

  function handlePreview() {
    const bienId = selectedBienId || null;
    const locId = selectedLocataireId || null;
    if (type === "quittance") {
      onPreview(`Quittance ${q.mois}`, q as unknown as Record<string, unknown>, bienId, locId);
    } else if (type === "bail") {
      onPreview(`Contrat de bail — ${b.locataire_prenom} ${b.locataire_nom}`, b as unknown as Record<string, unknown>, bienId, locId);
    } else {
      onPreview(`État des lieux ${e.type_edl === "entree" ? "d'entrée" : "de sortie"} — ${e.date}`, e as unknown as Record<string, unknown>, bienId, locId);
    }
  }

  function updatePiece(i: number, field: keyof PieceEtat, value: string) {
    setE(prev => {
      const pieces = [...prev.pieces];
      pieces[i] = { ...pieces[i], [field]: value };
      return { ...prev, pieces };
    });
  }

  const selecteursBienLoc = (
    <div className="space-y-4 pb-4 border-b border-slate-100 mb-4">
      <div>
        <label className={labelCls}>Bien associé</label>
        <select className={inputCls} value={selectedBienId} onChange={ev => setSelectedBienId(ev.target.value)}>
          <option value="">-- Sélectionner un bien --</option>
          {biens.map(bien => <option key={bien.id} value={bien.id}>{bien.nom} — {bien.adresse}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Locataire associé</label>
        <select className={inputCls} value={selectedLocataireId} onChange={ev => setSelectedLocataireId(ev.target.value)}>
          <option value="">-- Sélectionner un locataire --</option>
          {locataires.map(l => <option key={l.id} value={l.id}>{l.prenom} {l.nom}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      {selecteursBienLoc}

      {type === "quittance" && (
        <>
          <div><label className={labelCls}>Bailleur — Nom</label><input className={inputCls} value={q.bailleur_nom} onChange={ev => setQ(p => ({ ...p, bailleur_nom: ev.target.value }))} placeholder="Mohamed Alami" /></div>
          <div><label className={labelCls}>Bailleur — Adresse</label><input className={inputCls} value={q.bailleur_adresse} onChange={ev => setQ(p => ({ ...p, bailleur_adresse: ev.target.value }))} placeholder="12 rue des Roses, Casablanca" /></div>
          <div><label className={labelCls}>Locataire — Prénom</label><input className={inputCls} value={q.locataire_prenom} onChange={ev => setQ(p => ({ ...p, locataire_prenom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Locataire — Nom</label><input className={inputCls} value={q.locataire_nom} onChange={ev => setQ(p => ({ ...p, locataire_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse du bien</label><input className={inputCls} value={q.bien_adresse} onChange={ev => setQ(p => ({ ...p, bien_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>Ville</label><input className={inputCls} value={q.bien_ville} onChange={ev => setQ(p => ({ ...p, bien_ville: ev.target.value }))} /></div>
          <div>
            <label className={labelCls}>Mois concerné</label>
            <select className={inputCls} value={q.mois} onChange={ev => setQ(p => ({ ...p, mois: ev.target.value }))}>
              {MOIS_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Loyer (DH)</label><input type="number" className={inputCls} value={q.loyer || ""} onChange={ev => setQ(p => ({ ...p, loyer: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Charges (DH)</label><input type="number" className={inputCls} value={q.charges || ""} onChange={ev => setQ(p => ({ ...p, charges: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Date de paiement</label><input className={inputCls} value={q.date_paiement} onChange={ev => setQ(p => ({ ...p, date_paiement: ev.target.value }))} /></div>
        </>
      )}

      {type === "bail" && (
        <>
          <div>
            <label className={labelCls}>Type de bail</label>
            <select className={inputCls} value={b.type_bail} onChange={ev => setB(p => ({ ...p, type_bail: ev.target.value as "vide" | "meuble" }))}>
              <option value="vide">Bail vide</option>
              <option value="meuble">Bail meublé</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Durée</label>
            <select className={inputCls} value={b.duree} onChange={ev => setB(p => ({ ...p, duree: ev.target.value as BailData["duree"] }))}>
              <option value="1_an">1 an</option>
              <option value="3_ans">3 ans</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          {b.duree === "autre" && <div><label className={labelCls}>Durée précisée</label><input className={inputCls} value={b.duree_autre} onChange={ev => setB(p => ({ ...p, duree_autre: ev.target.value }))} placeholder="Ex: 6 mois" /></div>}
          <div><label className={labelCls}>Date de début</label><input type="date" className={inputCls} value={b.date_debut} onChange={ev => setB(p => ({ ...p, date_debut: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bailleur</p></div>
          <div><label className={labelCls}>Nom</label><input className={inputCls} value={b.bailleur_nom} onChange={ev => setB(p => ({ ...p, bailleur_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse</label><input className={inputCls} value={b.bailleur_adresse} onChange={ev => setB(p => ({ ...p, bailleur_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>CIN / SIRET</label><input className={inputCls} value={b.bailleur_cin} onChange={ev => setB(p => ({ ...p, bailleur_cin: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Locataire</p></div>
          <div><label className={labelCls}>Prénom</label><input className={inputCls} value={b.locataire_prenom} onChange={ev => setB(p => ({ ...p, locataire_prenom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Nom</label><input className={inputCls} value={b.locataire_nom} onChange={ev => setB(p => ({ ...p, locataire_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse actuelle</label><input className={inputCls} value={b.locataire_adresse} onChange={ev => setB(p => ({ ...p, locataire_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>CIN</label><input className={inputCls} value={b.locataire_cin} onChange={ev => setB(p => ({ ...p, locataire_cin: ev.target.value }))} /></div>
          <div><label className={labelCls}>Profession</label><input className={inputCls} value={b.locataire_profession} onChange={ev => setB(p => ({ ...p, locataire_profession: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Bien loué</p></div>
          <div><label className={labelCls}>Adresse</label><input className={inputCls} value={b.bien_adresse} onChange={ev => setB(p => ({ ...p, bien_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>Ville</label><input className={inputCls} value={b.bien_ville} onChange={ev => setB(p => ({ ...p, bien_ville: ev.target.value }))} /></div>
          <div><label className={labelCls}>Surface (m²)</label><input type="number" className={inputCls} value={b.bien_surface || ""} onChange={ev => setB(p => ({ ...p, bien_surface: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={b.bien_description} onChange={ev => setB(p => ({ ...p, bien_description: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Finances</p></div>
          <div><label className={labelCls}>Loyer mensuel (DH)</label><input type="number" className={inputCls} value={b.loyer || ""} onChange={ev => setB(p => ({ ...p, loyer: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Charges (DH)</label><input type="number" className={inputCls} value={b.charges || ""} onChange={ev => setB(p => ({ ...p, charges: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Dépôt de garantie (DH)</label><input type="number" className={inputCls} value={b.depot_garantie || ""} onChange={ev => setB(p => ({ ...p, depot_garantie: Number(ev.target.value) }))} /></div>
          <div><label className={labelCls}>Clauses particulières</label><textarea className={inputCls} rows={4} value={b.clauses_particulieres} onChange={ev => setB(p => ({ ...p, clauses_particulieres: ev.target.value }))} placeholder="Laisser vide si aucune" /></div>
        </>
      )}

      {type === "etat_des_lieux" && (
        <>
          <div>
            <label className={labelCls}>Type d&apos;état des lieux</label>
            <select className={inputCls} value={e.type_edl} onChange={ev => setE(p => ({ ...p, type_edl: ev.target.value as "entree" | "sortie" }))}>
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
            </select>
          </div>
          <div><label className={labelCls}>Date</label><input className={inputCls} value={e.date} onChange={ev => setE(p => ({ ...p, date: ev.target.value }))} /></div>
          <div><label className={labelCls}>Bailleur — Nom</label><input className={inputCls} value={e.bailleur_nom} onChange={ev => setE(p => ({ ...p, bailleur_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Locataire — Prénom</label><input className={inputCls} value={e.locataire_prenom} onChange={ev => setE(p => ({ ...p, locataire_prenom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Locataire — Nom</label><input className={inputCls} value={e.locataire_nom} onChange={ev => setE(p => ({ ...p, locataire_nom: ev.target.value }))} /></div>
          <div><label className={labelCls}>Adresse du bien</label><input className={inputCls} value={e.bien_adresse} onChange={ev => setE(p => ({ ...p, bien_adresse: ev.target.value }))} /></div>
          <div><label className={labelCls}>Ville</label><input className={inputCls} value={e.bien_ville} onChange={ev => setE(p => ({ ...p, bien_ville: ev.target.value }))} /></div>
          <div className="pt-2 border-t border-slate-100"><p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Compteurs</p></div>
          <div><label className={labelCls}>Eau</label><input className={inputCls} value={e.compteur_eau} onChange={ev => setE(p => ({ ...p, compteur_eau: ev.target.value }))} placeholder="Ex: 1234.5 m³" /></div>
          <div><label className={labelCls}>Électricité</label><input className={inputCls} value={e.compteur_electricite} onChange={ev => setE(p => ({ ...p, compteur_electricite: ev.target.value }))} placeholder="Ex: 5678 kWh" /></div>
          <div><label className={labelCls}>Gaz</label><input className={inputCls} value={e.compteur_gaz} onChange={ev => setE(p => ({ ...p, compteur_gaz: ev.target.value }))} placeholder="Ex: 234 m³ ou N/A" /></div>
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pièces</p>
              <button
                type="button"
                onClick={() => setE(p => ({ ...p, pieces: [...p.pieces, { nom: "", murs: "", sols: "", plafond: "", fenetres: "", observations: "" }] }))}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                + Ajouter une pièce
              </button>
            </div>
            {e.pieces.map((piece, i) => (
              <div key={i} className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <input
                    className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-sm font-medium"
                    value={piece.nom}
                    onChange={ev => updatePiece(i, "nom", ev.target.value)}
                    placeholder="Nom de la pièce"
                  />
                  <button
                    type="button"
                    onClick={() => setE(p => ({ ...p, pieces: p.pieces.filter((_, j) => j !== i) }))}
                    className="ml-2 text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["murs", "sols", "plafond", "fenetres"] as const).map(f => (
                    <div key={f}>
                      <label className="block text-xs text-slate-500 mb-0.5 capitalize">{f}</label>
                      <select
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs"
                        value={piece[f]}
                        onChange={ev => updatePiece(i, f, ev.target.value)}
                      >
                        <option value="">--</option>
                        <option value="Bon état">Bon état</option>
                        <option value="État moyen">État moyen</option>
                        <option value="Mauvais état">Mauvais état</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-slate-500 mb-0.5">Observations</label>
                  <input className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs" value={piece.observations} onChange={ev => updatePiece(i, "observations", ev.target.value)} placeholder="Optionnel" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bouton aperçu fixé en bas */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100" style={{ maxWidth: "512px", marginLeft: "auto" }}>
        <button
          onClick={handlePreview}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          Aperçu du document →
        </button>
      </div>
    </div>
  );
}
