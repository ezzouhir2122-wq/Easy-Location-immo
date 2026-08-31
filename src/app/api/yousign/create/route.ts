import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSignatureRequest, uploadDocument, addSigner, activateRequest } from "@/lib/yousign/client";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const form = await req.formData();
    const contratId = form.get("contrat_id") as string;
    const pdfFile = form.get("pdf") as File;
    const signerFirstName = form.get("prenom") as string;
    const signerLastName = form.get("nom") as string;
    const signerEmail = form.get("email") as string;
    const signerPhone = form.get("telephone") as string | null;

    if (!contratId || !pdfFile || !signerEmail) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    // Vérifier que le contrat appartient à l'utilisateur
    const { data: contrat } = await supabase.from("contrats").select("id, bien_nom").eq("id", contratId).eq("owner_id", user.id).single();
    if (!contrat) return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });

    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const requestName = `Bail — ${contrat.bien_nom ?? contratId}`;

    // 1. Créer la demande
    const request = await createSignatureRequest(requestName);

    // 2. Uploader le PDF
    const doc = await uploadDocument(request.id, pdfBuffer, pdfFile.name || "bail.pdf");

    // 3. Ajouter le signataire
    const signer = await addSigner(request.id, doc.id, {
      first_name: signerFirstName,
      last_name: signerLastName,
      email: signerEmail,
      ...(signerPhone ? { phone_number: signerPhone } : {}),
    });

    // 4. Activer la demande → envoie l'email au signataire
    await activateRequest(request.id);

    // 5. Mettre à jour le contrat
    await supabase.from("contrats").update({
      signature_status: "en_attente",
      signature_request_id: request.id,
      signature_signer_url: signer.signature_link ?? null,
    }).eq("id", contratId);

    return NextResponse.json({ success: true, request_id: request.id });
  } catch (err: any) {
    console.error("[yousign/create]", err);
    const msg = err?.message ?? "Erreur Yousign";
    const notConfigured = msg.includes("YOUSIGN_API_KEY");
    return NextResponse.json({ error: notConfigured ? "Yousign non configuré — ajoutez YOUSIGN_API_KEY dans .env" : msg }, { status: 500 });
  }
}
