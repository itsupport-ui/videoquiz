import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PanelSwitcher from "./PanelSwitcher";
import {
  Users, Package, Layers, BarChart3, CheckCircle2, AlertTriangle, ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  const sp = await searchParams;
  const view = sp.view || "dashboard";

  const [users, modules, attempts, mainModules, assignedSubs] = await Promise.all([
    prisma.user.count(),
    prisma.module.count(),
    prisma.attempt.findMany({ select: { passed: true, quizId: true } }) as Promise<Array<{ passed: boolean; quizId: string }>>,
    (prisma as any).mainModule.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.module.count({ where: { NOT: { mainModuleId: null as any } } as any }),
  ]);
  const passed = attempts.filter((a: { passed: boolean }) => a.passed).length;
  const completionRate = attempts.length ? Math.round((passed / attempts.length) * 100) : 0;

  return (
    <main>
      {view === "dashboard" && (
        <section className="animate-fade-in">
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-brown)] mb-5" style={{ fontFamily: "var(--font-serif)" }}>
            Admin Dashboard
          </h1>

          {/* Stats Cards - Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] card-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-brand-50)]">
                  <Users className="w-5 h-5 text-[var(--color-brand)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Users</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">{users}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] card-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-accent-50)]">
                  <Package className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Sub-modules</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">{modules}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] card-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-success-light)]">
                  <BarChart3 className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Completion Rate</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">{completionRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Row 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] card-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-ochre-50)]">
                  <Layers className="w-5 h-5 text-[var(--color-ochre)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Main Modules</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">{mainModules.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] card-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-brand-50)]">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-brand)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Assigned Subs</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">{assignedSubs}</p>
                </div>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] card-hover">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-error-light)]">
                  <AlertTriangle className="w-5 h-5 text-[var(--color-error)]" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Unassigned</p>
                  <p className="text-2xl font-bold text-[var(--color-text)]">{Math.max(0, modules - assignedSubs)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Modules Table */}
          <h3 className="text-lg font-bold text-[var(--color-brown)] mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            Main Modules Overview
          </h3>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-cream)]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Main Module</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Sub-modules</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Attempts</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Pass Rate</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {await (async () => {
                  const rows: Array<{ id: number; name: string; subs: number; attempts: number; rate: string; rateNum: number }> = [];
                  for (const mm of mainModules as Array<{ id: number; orderIndex: number; title: string }>) {
                    const subs = await prisma.module.findMany({ where: { mainModuleId: mm.id } as any, include: { quiz: true } });
                    const quizIds = subs.filter((m: any) => m.quiz).map((m: any) => m.quiz.id as string);
                    let attemptsCount = 0, passCount = 0;
                    if (quizIds.length) {
                      const atts = await prisma.attempt.findMany({ where: { quizId: { in: quizIds } }, select: { passed: true } });
                      attemptsCount = atts.length;
                      passCount = atts.filter(a => a.passed).length;
                    }
                    const rateNum = attemptsCount ? Math.round((passCount / attemptsCount) * 100) : 0;
                    rows.push({ id: mm.id, name: `${mm.orderIndex}. ${mm.title}`, subs: subs.length, attempts: attemptsCount, rate: `${rateNum}%`, rateNum });
                  }
                  return rows.map((r, i) => (
                    <tr key={i} className="relative hover:bg-[var(--color-cream)] transition-colors border-t border-[var(--color-border)]">
                      <td className="px-4 py-3">
                        <a href={`/admin/main-modules/${r.id}/progress`} className="absolute inset-0" aria-label={`Open ${r.name}`}></a>
                        <span className="font-medium text-sm text-[var(--color-text)]">{r.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-light)]">{r.subs}</td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-light)]">{r.attempts}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${r.rateNum >= 70 ? "badge-success" : r.rateNum >= 40 ? "badge-warning" : "badge-error"}`}>
                          {r.rate}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view !== "dashboard" && <PanelSwitcher view={view} />}
    </main>
  );
}
