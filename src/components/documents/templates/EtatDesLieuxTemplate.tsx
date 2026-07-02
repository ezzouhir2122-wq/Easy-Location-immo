export type PieceEtat = {
  nom: string;
  murs: string;
  sols: string;
  plafond: string;
  fenetres: string;
  observations: string;
};

export type EtatDesLieuxData = {
  type_edl: "entree" | "sortie";
  date: string;
  bailleur_nom: string;
  locataire_nom: string;
  locataire_prenom: string;
  bien_adresse: string;
  bien_ville: string;
  compteur_eau: string;
  compteur_electricite: string;
  compteur_gaz: string;
  pieces: PieceEtat[];
};

export default function EtatDesLieuxTemplate({ data }: { data: EtatDesLieuxData }) {
  return (
    <div
      className="document-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        fontFamily: "Georgia, serif",
        fontSize: "11pt",
        lineHeight: 1.6,
        color: "#1a1a1a",
        background: "white",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* En-tête */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a1a", paddingBottom: "8mm", marginBottom: "10mm" }}>
        <img src="/logo.png" alt="Easy Location Immo" style={{ height: "44px", width: "auto", marginBottom: "3mm" }} />
        <div style={{ fontSize: "17pt", fontWeight: "bold" }}>
          ÉTAT DES LIEUX D&apos;{data.type_edl === "entree" ? "ENTRÉE" : "SORTIE"}
        </div>
        <div style={{ fontSize: "11pt", marginTop: "2mm", color: "#444" }}>
          {data.bien_adresse || "—"} — {data.bien_ville || ""}
        </div>
        <div style={{ fontSize: "11pt", marginTop: "1mm", color: "#444" }}>
          Réalisé le : {data.date || "—"}
        </div>
      </div>

      {/* Parties */}
      <div style={{ display: "flex", gap: "8mm", marginBottom: "8mm" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>Bailleur</div>
          <div>{data.bailleur_nom || "—"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>Locataire</div>
          <div>{data.locataire_prenom || ""} {data.locataire_nom || "—"}</div>
        </div>
      </div>

      {/* Compteurs */}
      <div style={{ marginBottom: "8mm", padding: "4mm 6mm", background: "#f9f9f9", border: "1px solid #eee" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>Relevés de compteurs</div>
        <div style={{ display: "flex", gap: "10mm" }}>
          <div><span style={{ color: "#666" }}>Eau : </span><strong>{data.compteur_eau || "—"}</strong></div>
          <div><span style={{ color: "#666" }}>Électricité : </span><strong>{data.compteur_electricite || "—"}</strong></div>
          <div><span style={{ color: "#666" }}>Gaz : </span><strong>{data.compteur_gaz || "—"}</strong></div>
        </div>
      </div>

      {/* Tableau des pièces */}
      {data.pieces && data.pieces.length > 0 && (
        <div style={{ marginBottom: "8mm" }}>
          <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#2563EB", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #2563EB", paddingBottom: "2mm", marginBottom: "4mm" }}>
            État des pièces
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                {["Pièce", "Murs", "Sols", "Plafond", "Fenêtres", "Observations"].map(h => (
                  <th key={h} style={{ padding: "2mm 3mm", border: "1px solid #ddd", textAlign: "left", fontWeight: "bold" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.pieces.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd", fontWeight: "bold" }}>{p.nom || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.murs || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.sols || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.plafond || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.fenetres || "—"}</td>
                  <td style={{ padding: "2mm 3mm", border: "1px solid #ddd" }}>{p.observations || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <div style={{ marginTop: "15mm", display: "flex", justifyContent: "space-between" }}>
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

      <div style={{ marginTop: "10mm", fontSize: "9pt", color: "#888", borderTop: "1px solid #eee", paddingTop: "5mm" }}>
        Fait en deux exemplaires. Document généré par Easy Location Immo.
      </div>
    </div>
  );
}
