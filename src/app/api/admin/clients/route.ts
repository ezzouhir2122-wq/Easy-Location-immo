import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function PATCH(request: Request) {
  const { supabase } = await requireAdmin();
  const body = await request.json();
  if (!body?.id || !["active", "suspended"].includes(body.status)) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const { error } = await supabase.from("profiles").update({ status: body.status, updated_at: new Date().toISOString() }).eq("id", body.id).eq("role", "client");
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
