import { createClient } from "@/lib/supabase/server";

const plans = [
  { id: "basic", name: "Basic", price: "49 DH", limit: "Jusqu’à 3 biens", features: ["Dashboard immobilier", "Suivi des loyers", "Documents essentiels"] },
  { id: "pro", name: "Pro", price: "149 DH", limit: "Jusqu’à 20 biens", features: ["Toutes les fonctions Basic", "Contrats et quittances", "Fiscalité et rapports"] },
  { id: "agency", name: "Agence", price: "299 DH", limit: "Biens illimités", features: ["Toutes les fonctions Pro", "Gestion multi-utilisateurs", "Support prioritaire"] },
];

export default async function AbonnementPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: subscription } = user
    ? await supabase.from("subscriptions").select("plan, status, start_date, end_date").eq("user_id", user.id).in("status", ["trialing", "active"]).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const currentPlan = plans.find((plan) => plan.id === subscription?.plan);

  return (
    <div className="max-w-6xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>Mon abonnement</h1>
        <p className="mt-1 text-sm text-slate-500">Gérez votre accès aux fonctionnalités Easy Location IMMO.</p>
      </div>

      <section className="mb-8 rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
        <p className="text-xs uppercase tracking-wider text-blue-300">Statut actuel</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{currentPlan?.name ?? "Aucun abonnement actif"}</h2>
            <p className="mt-1 text-sm text-slate-300">{subscription ? `Statut : ${subscription.status === "trialing" ? "Période d’essai" : "Actif"}` : "Choisissez un plan pour débloquer votre espace SaaS."}</p>
          </div>
          {currentPlan && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">{currentPlan.price} / mois</span>}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.id} className={`rounded-2xl border bg-white p-6 shadow-sm ${plan.id === "pro" ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-100"}`}>
            {plan.id === "pro" && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">Le plus populaire</span>}
            <h3 className="mt-3 text-xl font-bold text-slate-900">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{plan.price}<span className="text-sm font-normal text-slate-400"> / mois</span></p>
            <p className="mt-2 text-sm font-medium text-slate-600">{plan.limit}</p>
            <ul className="mt-5 space-y-3 text-sm text-slate-500">{plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
            <button disabled className="mt-6 w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500">Paiement bientôt disponible</button>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-400">Les paiements Stripe seront activés après validation des plans et des tarifs.</p>
    </div>
  );
}
