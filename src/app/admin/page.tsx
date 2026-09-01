import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ count: clients }, { count: subscriptions }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]),
  ]);

  return (
    <div>
      <p className="text-sm text-slate-400">Vue globale de votre plateforme</p>
      <h2 className="mt-1 text-3xl font-bold">Bonjour administrateur</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/admin/clients" className="rounded-2xl bg-white/10 p-6 transition hover:bg-white/15">
          <p className="text-sm text-slate-300">Clients inscrits</p>
          <p className="mt-2 text-4xl font-bold">{clients ?? 0}</p>
        </Link>
        <Link href="/admin/subscriptions" className="rounded-2xl bg-blue-600 p-6 transition hover:bg-blue-500">
          <p className="text-sm text-blue-100">Abonnements actifs</p>
          <p className="mt-2 text-4xl font-bold">{subscriptions ?? 0}</p>
        </Link>
      </div>
    </div>
  );
}
