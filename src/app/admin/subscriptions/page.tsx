import { requireAdmin } from "@/lib/supabase/auth";
import SubscriptionManagement from "./SubscriptionManagement";

export default async function AdminSubscriptionsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: subscriptions }, { data: clients }] = await Promise.all([
    supabase.from("subscriptions").select("id, user_id, plan, status, start_date, end_date, profiles(email, nom, prenom)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, nom, prenom").eq("role", "client").order("email"),
  ]);
  return <SubscriptionManagement subscriptions={subscriptions ?? []} clients={clients ?? []} />;
}
