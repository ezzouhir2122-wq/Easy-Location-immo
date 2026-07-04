export type QuittanceData = {
  bailleur_nom: string;
  bailleur_adresse: string;
  locataire_nom: string;
  locataire_prenom: string;
  bien_adresse: string;
  bien_ville: string;
  mois: string;
  loyer: number;
  charges: number;
  date_paiement: string;
};

export default function QuittanceTemplate({ data }: { data: QuittanceData }) {
  const total = (data.loyer || 0) + (data.charges || 0);

  return (
    <div
      className="document-print-area"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "20mm",
        fontFamily: "Georgia, serif",
        fontSize: "12pt",
        lineHeight: 1.6,
        color: "#1a1a1a",
        background: "white",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* En-tête */}
      <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: "8mm", marginBottom: "10mm" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <img src="/logo.png" alt="Easy Location Immo" style={{ height: "40px", width: "auto" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18pt", fontWeight: "bold", letterSpacing: "1px" }}>QUITTANCE DE LOYER</div>
            <div style={{ fontSize: "11pt", marginTop: "2mm" }}>Période : {data.mois || "—"}</div>
          </div>
        </div>
      </div>

      {/* Bailleur */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>
          Bailleur
        </div>
        <div style={{ fontSize: "12pt" }}>{data.bailleur_nom || "—"}</div>
        <div style={{ fontSize: "11pt", color: "#444" }}>{data.bailleur_adresse || "—"}</div>
      </div>

      {/* Locataire */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>
          Locataire
        </div>
        <div style={{ fontSize: "12pt" }}>{data.locataire_prenom || ""} {data.locataire_nom || "—"}</div>
      </div>

      {/* Bien loué */}
      <div style={{ marginBottom: "8mm" }}>
        <div style={{ fontWeight: "bold", fontSize: "10pt", fontFamily: "sans-serif", color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3mm" }}>
          Bien loué
        </div>
        <div style={{ fontSize: "12pt" }}>{data.bien_adresse || "—"}</div>
        <div style={{ fontSize: "11pt", color: "#444" }}>{data.bien_ville || ""}</div>
      </div>

      {/* Tableau des montants */}
      <div style={{ margin: "10mm 0", border: "1px solid #ddd" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12pt" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: "4mm 6mm", textAlign: "left", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Désignation</th>
              <th style={{ padding: "4mm 6mm", textAlign: "right", borderBottom: "1px solid #ddd", fontWeight: "bold" }}>Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "4mm 6mm", borderBottom: "1px solid #eee" }}>Loyer mensuel</td>
              <td style={{ padding: "4mm 6mm", textAlign: "right", borderBottom: "1px solid #eee" }}>{(data.loyer || 0).toLocaleString("fr-FR")} DH</td>
            </tr>
            <tr>
              <td style={{ padding: "4mm 6mm", borderBottom: "1px solid #eee" }}>Charges</td>
              <td style={{ padding: "4mm 6mm", textAlign: "right", borderBottom: "1px solid #eee" }}>{(data.charges || 0).toLocaleString("fr-FR")} DH</td>
            </tr>
            <tr style={{ fontWeight: "bold", background: "#f9f9f9" }}>
              <td style={{ padding: "4mm 6mm" }}>TOTAL</td>
              <td style={{ padding: "4mm 6mm", textAlign: "right" }}>{total.toLocaleString("fr-FR")} DH</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Déclaration */}
      <div style={{ margin: "10mm 0", padding: "6mm", background: "#f9f9f9", border: "1px solid #eee", fontSize: "11pt" }}>
        Je soussigné(e) <strong>{data.bailleur_nom || "—"}</strong>, bailleur du logement désigné ci-dessus, déclare avoir reçu de{" "}
        <strong>{data.locataire_prenom || ""} {data.locataire_nom || "—"}</strong> la somme de{" "}
        <strong>{total.toLocaleString("fr-FR")} DH</strong> au titre du loyer et des charges du mois de{" "}
        <strong>{data.mois || "—"}</strong>, et lui en donne quittance sous réserve de tous mes droits.
      </div>

      {/* Date paiement */}
      <div style={{ marginBottom: "10mm", fontSize: "11pt" }}>
        <strong>Date de paiement :</strong> {data.date_paiement || "—"}
      </div>

      {/* Signature */}
      <div style={{ marginTop: "20mm", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "70mm" }}>
          <div style={{ fontSize: "11pt", marginBottom: "15mm" }}>Signature du bailleur</div>
          <div style={{ borderBottom: "1px solid #888", width: "60mm" }} />
          <div style={{ fontSize: "10pt", marginTop: "3mm", color: "#666" }}>{data.bailleur_nom || ""}</div>
        </div>
      </div>

      {/* Mention légale */}
      <div style={{ marginTop: "15mm", fontSize: "9pt", color: "#888", borderTop: "1px solid #eee", paddingTop: "5mm" }}>
        Cette quittance annule tous les reçus qui auraient pu être établis précédemment en règlement du loyer de la période indiquée. Document généré par Easy Location Immo.
      </div>
    </div>
  );
}
