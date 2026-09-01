import Sidebar from "@/components/layout/Sidebar";
import CommandPalette from "@/components/layout/CommandPalette";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#fbfaf7]">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
