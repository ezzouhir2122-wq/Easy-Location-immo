import React from "react";

export type BailData = {
  type_bail: "vide" | "meuble";
  duree: "1_an" | "3_ans" | "autre";
  duree_autre: string;
  date_debut: string;
  bailleur_nom: string;
  bailleur_adresse: string;
  bailleur_cin: string;
  locataire_nom: string;
  locataire_prenom: string;
  locataire_adresse: string;
  locataire_cin: string;
  locataire_profession: string;
  bien_adresse: string;
  bien_ville: string;
  bien_surface: number;
  bien_description: string;
  loyer: number;
  charges: number;
  depot_garantie: number;
  clauses_particulieres: string;
};

const DUREE_LABEL: Record<string, string> = {
  "1_an": "1 an",
  "3_ans": "3 ans",
  "autre": "",
};

const s: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: "11pt",
  lineHeight: 1.7,
  color: "#1a1a1a",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "8mm" }}>
      <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #2563EB", paddingBottom: "2mm", marginBottom: "4mm" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", gap: "4mm", marginBottom: "1mm" }}>
      <span style={{ minWidth: "50mm", color: "#555", fontSize: "10pt" }}>{label} :</span>
      <span style={{ fontWeight: 500 }}>{value || "—"}</span>
    </div>
  );
}

export default function BailTemplate({ data }: { data: BailData }) {
  const dureeLabel = data.duree === "autre" ? data.duree_autre : DUREE_LABEL[data.duree] || "—";

  return (
    <div
      className="document-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        background: "white",
        margin: "0 auto",
        boxSizing: "border-box",
        ...s,
      }}
    >
      {/* En-tête */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "8mm", marginBottom: "10mm" }}>
        <img src="/logo.png" alt="Easy Location Immo" style={{ height: "44px", width: "auto", marginBottom: "3mm" }} />
        <div style={{ fontSize: "18pt", fontWeight: "bold" }}>
          CONTRAT DE BAIL {data.type_bail === "meuble" ? "MEUBLÉ" : "D'HABITATION"}
        </div>
        <div style={{ fontSize: "11pt", marginTop: "2mm", color: "#444" }}>
          Durée : {dureeLabel} — À compter du {data.date_debut || "—"}
        </div>
      </div>

      <Section title="Bailleur">
        <Row label="Nom" value={data.bailleur_nom} />
        <Row label="Adresse" value={data.bailleur_adresse} />
        <Row label="CIN / SIRET" value={data.bailleur_cin} />
      </Section>

      <Section title="Locataire">
        <Row label="Nom" value={`${data.locataire_prenom} ${data.locataire_nom}`} />
        <Row label="Adresse actuelle" value={data.locataire_adresse} />
        <Row label="CIN" value={data.locataire_cin} />
        <Row label="Profession" value={data.locataire_profession} />
      </Section>

      <Section title="Bien loué">
        <Row label="Adresse" value={data.bien_adresse} />
        <Row label="Ville" value={data.bien_ville} />
        <Row label="Surface" value={`${data.bien_surface || 0} m²`} />
        {data.bien_description && <Row label="Description" value={data.bien_description} />}
      </Section>

      <Section title="Conditions financières">
        <Row label="Loyer mensuel" value={`${(data.loyer || 0).toLocaleString("fr-FR")} DH`} />
        <Row label="Charges" value={`${(data.charges || 0).toLocaleString("fr-FR")} DH`} />
        <Row label="Dépôt de garantie" value={`${(data.depot_garantie || 0).toLocaleString("fr-FR")} DH`} />
        <Row label="Total mensuel" value={`${((data.loyer || 0) + (data.charges || 0)).toLocaleString("fr-FR")} DH`} />
      </Section>

      {data.clauses_particulieres && (
        <Section title="Clauses particulières">
          <div style={{ fontSize: "11pt", whiteSpace: "pre-wrap" }}>{data.clauses_particulieres}</div>
        </Section>
      )}

      {/* Signatures */}
      <div style={{ marginTop: "20mm", display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", width: "75mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Le Bailleur</div>
          <div style={{ borderBottom: "1px solid #888", width: "65mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>{data.bailleur_nom || ""}</div>
        </div>
        <div style={{ textAlign: "center", width: "75mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Le Locataire</div>
          <div style={{ borderBottom: "1px solid #888", width: "65mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>
            {data.locataire_prenom || ""} {data.locataire_nom || ""}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "15mm", fontSize: "9pt", color: "#888", borderTop: "1px solid #eee", paddingTop: "5mm" }}>
        Fait en deux exemplaires originaux. Document généré par Easy Location Immo.
      </div>
    </div>
  );
}
