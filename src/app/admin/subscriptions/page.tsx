import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminSubscriptionsPage() {
  const { supabase } = await requireAdmin();
  const { data: subscriptions } = await supabase.from("subscriptions").select("id, user_id, plan, status, start_date, end_date, profiles(email)").order("created_at", { ascending: false });

  return (
    <div>
      <a href="/admin" className="text-sm text-blue-300">← Administration</a>
      <h2 className="mt-3 text-3xl font-bold">Abonnements</h2>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {(subscriptions ?? []).map((subscription) => {
          const profile = Array.isArray(subscription.profiles) ? subscription.profiles[0] : subscription.profiles;
          return <div key={subscription.id} className="flex items-center justify-between border-b border-white/5 px-5 py-4 text-sm last:border-0"><span>{profile?.email ?? subscription.user_id}</span><span className="capitalize text-blue-200">{subscription.plan}</span><span className="text-emerald-300">{subscription.status}</span></div>;
        })}
        {!subscriptions?.length && <p className="px-5 py-8 text-sm text-slate-400">Aucun abonnement pour le moment.</p>}
      </div>
    </div>
  );
}
