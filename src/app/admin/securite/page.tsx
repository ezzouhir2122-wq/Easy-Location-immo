import { requireAdmin } from "@/lib/supabase/auth";
import SecuritySettings from "./SecuritySettings";
export default async function SecurityPage() { const { supabase, user } = await requireAdmin(); const { data: logs } = await supabase.from("admin_activity_logs").select("id, action, target_id, details, created_at").order("created_at", { ascending: false }).limit(25); return <SecuritySettings email={user.email ?? ""} logs={logs ?? []} />; }
