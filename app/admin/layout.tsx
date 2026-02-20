import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./Sidebar";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="bg-white border-b md:border-b-0 md:border-r border-[var(--color-border)] px-4 py-4 bg-leaves">
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-8 h-8 rounded-[var(--radius)] bg-[var(--color-brand)] text-white flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-brand)] leading-tight" style={{ fontFamily: "var(--font-serif)" }}>Admin Panel</h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">Manage your portal</p>
          </div>
        </div>
        <AdminSidebar />
      </aside>
      {/* Main Content */}
      <section className="p-4 md:p-6 lg:p-8 max-w-[1200px]">{children}</section>
    </div>
  );
}
