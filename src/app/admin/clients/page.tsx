import { requireAdmin } from "@/lib/supabase/auth";
import ClientManagement from "./ClientManagement";

export default async function AdminClientsPage() {
  const { supabase } = await requireAdmin();
  const { data: clients } = await supabase.from("profiles").select("id, email, nom, prenom, role, status, created_at").eq("role", "client").order("created_at", { ascending: false });

  return <ClientManagement clients={clients ?? []} />;
}
