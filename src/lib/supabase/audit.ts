import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAdminAction(supabase: SupabaseClient, adminId: string, action: string, targetId?: string, details: Record<string, unknown> = {}) {
  await supabase.from("admin_activity_logs").insert({ admin_id: adminId, action, target_id: targetId ?? null, details });
}
