import { requireAdmin } from "@/lib/supabase/auth";
import RequestManagement from "./RequestManagement";

export default async function AdminRequestsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("partner_requests").select("*").order("created_at", { ascending: false });
  return <RequestManagement requests={data ?? []} />;
}
