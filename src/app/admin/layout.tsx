import { requireAdmin } from "@/lib/supabase/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Easy Location IMMO</p>
            <h1 className="text-xl font-semibold">Administration SaaS</h1>
          </div>
          <a href="/dashboard" className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
            Espace client
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
