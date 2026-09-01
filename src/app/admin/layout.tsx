import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-cyan-400/10 bg-[#0a1729]/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Easy Location IMMO</p>
            <h1 className="text-xl font-bold tracking-tight">Administration SaaS</h1>
          </div>
          <div className="flex items-center gap-3"><a href="/admin/demandes" className="hidden text-sm font-semibold text-slate-300 transition hover:text-cyan-200 sm:block">Demandes</a><a href="/dashboard" className="rounded-xl border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-400/10">Espace client</a></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
