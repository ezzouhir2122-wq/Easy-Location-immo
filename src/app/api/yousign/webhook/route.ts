import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventName: string = body?.event_name ?? "";
    const requestId: string = body?.data?.signature_request?.id ?? "";

    if (!requestId) return NextResponse.json({ ok: true });

    const supabase = await createClient();

    if (eventName === "signature_request.done") {
      await supabase.from("contrats")
        .update({ signature_status: "signe", signature_signed_at: new Date().toISOString() })
        .eq("signature_request_id", requestId);
    } else if (eventName === "signature_request.expired") {
      await supabase.from("contrats")
        .update({ signature_status: "expire" })
        .eq("signature_request_id", requestId);
    } else if (eventName === "signature_request.declined") {
      await supabase.from("contrats")
        .update({ signature_status: "refuse" })
        .eq("signature_request_id", requestId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[yousign/webhook]", err);
    return NextResponse.json({ ok: true }); // toujours 200 pour Yousign
  }
}
