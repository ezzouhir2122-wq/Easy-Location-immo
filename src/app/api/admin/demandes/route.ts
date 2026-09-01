import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const statuses = ["pending", "under_review", "approved", "rejected", "needs_info"];

export async function PATCH(request: Request) {
  const { supabase, user } = await requireAdmin();
  const body = await request.json();
  if (!body?.id || !statuses.includes(body.statut)) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { data: application, error: readError } = await supabase.from("partner_requests").select("*").eq("id", body.id).single();
  if (readError || !application) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

  // Une approbation crée un compte Auth et déclenche le profil client.
  if (body.statut === "approved" && application.statut !== "approved") {
    try {
      const admin = createAdminClient();
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      let existing = users.users.find((item) => item.email?.toLowerCase() === application.email.toLowerCase());
      if (!existing) {
        const { data, error } = await admin.auth.admin.inviteUserByEmail(application.email, {
          data: { full_name: application.nom, partner_type: application.type_profil },
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://easy-location-immo.vercel.app"}/reset-password`,
        });
        if (error) return NextResponse.json({ error: `Invitation impossible : ${error.message}` }, { status: 502 });
        existing = data.user ?? undefined;
      }
      if (existing) {
        await admin.from("profiles").upsert({ id: existing.id, email: application.email, nom: application.nom, telephone: application.telephone, ville: application.ville, role: "client", status: "active", updated_at: new Date().toISOString() });
      }
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Invitation impossible" }, { status: 500 });
    }
  }

  const { error } = await supabase.from("partner_requests").update({ statut: body.statut, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ ok: true });
}
