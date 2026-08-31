const BASE = process.env.YOUSIGN_SANDBOX === "true"
  ? "https://api-sandbox.yousign.app/v3"
  : "https://api.yousign.app/v3";

function headers() {
  const key = process.env.YOUSIGN_API_KEY;
  if (!key) throw new Error("YOUSIGN_API_KEY manquante dans .env");
  return { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function createSignatureRequest(name: string) {
  const res = await fetch(`${BASE}/signature_requests`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name, delivery_mode: "email", timezone: "Africa/Casablanca" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ id: string }>;
}

export async function uploadDocument(requestId: string, pdfBuffer: Buffer, filename: string) {
  const boundary = "----YousignBoundary";
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`),
    pdfBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const key = process.env.YOUSIGN_API_KEY;
  if (!key) throw new Error("YOUSIGN_API_KEY manquante dans .env");
  const res = await fetch(`${BASE}/signature_requests/${requestId}/documents`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ id: string }>;
}

export async function addSigner(requestId: string, documentId: string, signer: { first_name: string; last_name: string; email: string; phone_number?: string }) {
  const res = await fetch(`${BASE}/signature_requests/${requestId}/signers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      info: { ...signer, locale: "fr" },
      signature_level: "electronic_signature",
      signature_authentication_mode: "no_otp",
      fields: [{ document_id: documentId, type: "signature", page: 1, x: 77, y: 640, width: 200, height: 70 }],
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ id: string; signature_link?: string }>;
}

export async function activateRequest(requestId: string) {
  const res = await fetch(`${BASE}/signature_requests/${requestId}/activate`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
