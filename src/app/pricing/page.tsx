import Link from "next/link";

const plans = [
  { name: "Basic", price: "49 DH", description: "Pour gérer quelques biens", features: ["Jusqu’à 3 biens", "Suivi des loyers", "Documents essentiels"] },
  { name: "Pro", price: "149 DH", description: "Pour les propriétaires actifs", features: ["Jusqu’à 20 biens", "Contrats et quittances", "Fiscalité et rapports"], featured: true },
  { name: "Agence", price: "299 DH", description: "Pour les agences immobilières", features: ["Biens illimités", "Multi-utilisateurs", "Support prioritaire"] },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">Easy Location <span className="text-blue-400">IMMO</span></Link>
          <Link href="/login" className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Se connecter</Link>
        </div>
        <section className="mx-auto max-w-2xl py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">Tarifs simples</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Gérez vos locations avec sérénité.</h1>
          <p className="mt-5 text-slate-300">Choisissez le plan adapté à votre portefeuille immobilier au Maroc.</p>
        </section>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative rounded-3xl p-7 ${plan.featured ? "bg-blue-600 ring-2 ring-blue-300" : "border border-white/10 bg-white/5"}`}>
              {plan.featured && <span className="absolute right-6 top-6 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Recommandé</span>}
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className={`mt-2 text-sm ${plan.featured ? "text-blue-100" : "text-slate-400"}`}>{plan.description}</p>
              <p className="mt-7 text-4xl font-bold">{plan.price}<span className="text-sm font-normal opacity-70"> / mois</span></p>
              <ul className={`mt-7 space-y-3 text-sm ${plan.featured ? "text-blue-50" : "text-slate-300"}`}>
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              </ul>
              <Link href="/register" className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold ${plan.featured ? "bg-white text-blue-700 hover:bg-blue-50" : "bg-white text-slate-900 hover:bg-blue-50"}`}>Commencer</Link>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-500">Paiement en ligne bientôt disponible. Aucun engagement pendant la phase de lancement.</p>
      </div>
    </main>
  );
}
