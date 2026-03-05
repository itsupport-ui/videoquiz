import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMainModuleProgress } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProfileForm from "./profile/profile-form";
import CertificatePanel from "@/components/CertificatePanel";
import UserSidebar from "./UserSidebar";
import HoverVideoPreview from "@/components/HoverVideoPreview";
import {
  BookOpen, Target, Award, ChevronRight, ArrowRight,
  CheckCircle2, Lock, PlayCircle, TrendingUp, Sparkles,
  AlertTriangle, Trophy, Activity, BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin");

  const sp   = await searchParams;
  const view = sp.view || "dashboard";

  const groups = await getMainModuleProgress((session.user as any).id);
  const totalSubs        = groups.reduce((s, g) => s + g.subModules.length, 0);
  const passedCount      = groups.reduce((s, g) => s + g.subModules.filter((m) => m.status === "PASSED").length, 0);
  const allPassed        = totalSubs > 0 && passedCount === totalSubs;
  const overallPct       = totalSubs > 0 ? Math.round((passedCount / totalSubs) * 100) : 0;
  const completedModules = groups.filter(g => g.completed).length;
  const totalAttempts    = groups.reduce((s, g) => s + g.subModules.reduce((ss, m) => ss + m.attemptsUsed, 0), 0);

  const currentMainModule = groups.find(g => !g.completed);
  const nextSubModule     = currentMainModule?.subModules.find(m => m.status === "PENDING");

  // Global average from already-fetched data (no extra DB round-trip)
  const allScores     = groups.flatMap(g => g.subModules.filter(m => m.lastScore !== null).map(m => m.lastScore!));
  const globalAverage = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  // Failed module detection
  const failedItems = groups.flatMap(g =>
    g.subModules.filter(m => m.status === "FAILED").map(m => ({ groupTitle: g.title, moduleTitle: m.title }))
  );
  const hasFailedModules = failedItems.length > 0;

  // Certificate — query Prisma directly (avoids broken relative fetch() in server component)
  const certRecord = await (prisma as any).certificate.findFirst({
    where: { userId: (session.user as any).id, mainModuleId: null },
  });
  const certificate = {
    eligible: allPassed,
    url: certRecord && allPassed ? `/api/certificate/download` : undefined,
  };

  // Recent activity — last 4 attempts with module title
  const recentAttempts = await (prisma as any).attempt.findMany({
    where:   { userId: (session.user as any).id },
    orderBy: { submittedAt: "desc" },
    take:    4,
    include: { quiz: { include: { module: true } } },
  });

  const userName = (session.user as any).name || "there";

  const DashboardInner = (
    <div className="animate-fade-in">
      {/* ── Hero Welcome Banner ── */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-brand-dark)] text-white p-6 md:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-2 w-24 h-24 rounded-full bg-white/[0.03]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-white/85 text-sm mb-1 [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">Welcome back,</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 [text-shadow:0_2px_4px_rgba(0,0,0,0.1)]" style={{ fontFamily: "var(--font-serif)" }}>
              {userName}
            </h1>
            <p className="text-white/85 text-sm max-w-md [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
              {allPassed
                ? "Congratulations! You have completed all training modules."
                : currentMainModule
                ? `Continue your learning journey — currently on "${currentMainModule.title}"`
                : "Start your Ayurveda training journey today."}
            </p>
            {currentMainModule && nextSubModule && (
              <Link
                href={`/module/${nextSubModule.id}`}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[var(--color-accent)] text-white rounded-[var(--radius)] text-sm font-medium hover:bg-[var(--color-accent-dark)] transition-all hover:shadow-lg animate-pulse-subtle"
              >
                <PlayCircle className="w-4 h-4" /> Continue Learning
              </Link>
            )}
          </div>
          {/* Progress Ring */}
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 md:w-28 md:h-28">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-accent)" strokeWidth="10"
                  strokeDasharray={`${Math.max(0.001, overallPct / 100) * 2 * Math.PI * 48} ${2 * Math.PI * 48}`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{overallPct}%</span>
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Failed-Module Alert Banner ── */}
      {hasFailedModules && (
        <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4 mb-6 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 text-sm mb-1">Attention — quiz attempts exhausted</p>
            <ul className="text-xs text-amber-700 space-y-0.5">
              {failedItems.slice(0, 3).map((f, i) => (
                <li key={i}>• <span className="font-medium">{f.moduleTitle}</span> in {f.groupTitle}</li>
              ))}
              {failedItems.length > 3 && <li className="text-amber-500">…and {failedItems.length - 3} more</li>}
            </ul>
            <p className="text-xs text-amber-600 mt-1.5">Please contact your administrator to reset your attempts.</p>
          </div>
        </div>
      )}

      {/* ── All Passed Banner ── */}
      {allPassed && (
        <div className="rounded-[var(--radius-lg)] border border-[#B7E4C7] bg-[var(--color-success-light)] p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#1B6B41] shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-[#1B6B41]">All modules complete!</p>
            <p className="text-sm text-[#2D7D4C]">
              {certificate.url ? "Your certificate is ready for download." : "Head to the Certificate section to claim yours."}
            </p>
          </div>
          <Link href={certificate.url || "/?view=certificate"} className="btn btn-primary text-sm shrink-0">
            {certificate.url ? "Download" : "View Certificate"}
          </Link>
        </div>
      )}

      {/* ── Empty State ── */}
      {groups.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-12 mb-6 flex flex-col items-center text-center">
          <BookOpen className="w-12 h-12 text-[var(--color-brand-100)] mb-3" />
          <p className="font-semibold text-[var(--color-text)] mb-1">No modules assigned yet</p>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
            Your training modules will appear here once your administrator has set them up. Check back soon!
          </p>
        </div>
      )}

      {/* ── Stats Cards ── */}
      {groups.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {/* Sub-modules */}
          <div className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-card)] ${allPassed ? "bg-[var(--color-brand-50)] border-[var(--color-brand)]/30" : "bg-white border-[var(--color-border)]"}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-[var(--radius)] border ${allPassed ? "bg-[var(--color-brand)] border-[var(--color-brand)]" : "bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-brand-100)] border-[var(--color-brand-100)]"}`}>
                {allPassed ? <Trophy className="w-5 h-5 text-white" /> : <BookOpen className="w-5 h-5 text-[var(--color-brand)]" />}
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Sub-modules</p>
                <p className={`text-2xl font-bold ${allPassed ? "text-[var(--color-brand)]" : "text-[var(--color-text)]"}`}>{passedCount}/{totalSubs}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{allPassed ? "All complete ✓" : `${totalSubs - passedCount} remaining`}</p>
              </div>
            </div>
          </div>
          {/* Main Modules */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-accent-50)] to-[var(--color-accent-100)] border border-[var(--color-accent-100)]">
                <Target className="w-5 h-5 text-[var(--color-accent)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Main Modules</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{completedModules}/{groups.length}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{groups.length - completedModules > 0 ? `${groups.length - completedModules} in progress` : "All done"}</p>
              </div>
            </div>
          </div>
          {/* Quizzes Passed (replaces misleading "Attempts Left") */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-ochre-50)] to-[var(--color-ochre-100)] border border-[var(--color-ochre-100)]">
                <TrendingUp className="w-5 h-5 text-[var(--color-ochre)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Quizzes Passed</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{passedCount}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">of {totalSubs} total</p>
              </div>
            </div>
          </div>
          {/* Average Score */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-success-50)] border border-[var(--color-success-50)]">
                <Award className="w-5 h-5 text-[var(--color-success)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Avg Score</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{globalAverage !== null ? `${globalAverage}%` : ""}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  {globalAverage !== null ? (globalAverage >= 70 ? "Above pass mark" : "Below pass mark") : "No attempts yet"}
                </p>
              </div>
            </div>
          </div>
          {/* Total Attempts */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100">
                <BarChart3 className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-[var(--color-text-muted)]">Total Attempts</p>
                <p className="text-2xl font-bold text-[var(--color-text)]">{totalAttempts}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">across all quizzes</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Recent Activity Strip  */}
      {recentAttempts.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Recent Activity</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {recentAttempts.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${a.passed ? "bg-[var(--color-success)]" : "bg-red-400"}`} />
                  <span className="text-[var(--color-text-light)] truncate">{a.quiz?.module?.title || "Quiz"}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold ${a.passed ? "text-[var(--color-success)]" : "text-red-500"}`}>{a.score}%</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{timeAgo(a.submittedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Learning Path  */}
      {groups.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-brown)]" style={{ fontFamily: "var(--font-serif)" }}>Learning Path</h2>
            <span className="text-sm text-[var(--color-text-muted)]">{completedModules} of {groups.length} completed</span>
          </div>

          {/* Horizontal track  md+ */}
          <div className="hidden md:flex items-center gap-0 mb-6 overflow-x-auto pb-2">
            {groups.map((g, i) => {
              const isComplete = g.completed;
              const isCurrent  = !g.completed && (i === 0 || groups[i - 1]?.completed);
              const passed  = g.subModules.filter((m) => m.status === "PASSED").length;
              const total   = g.subModules.length;
              const percent = total ? Math.round((passed / total) * 100) : 0;
              return (
                <div key={g.id} className="flex items-center">
                  <Link href={`/main-module/${g.id}`} className="flex flex-col items-center group relative" title={`${g.title}  ${percent}% complete`}>
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all hover:scale-110 ${
                      isComplete  ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                      : isCurrent ? "bg-white border-[var(--color-accent)] text-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-accent-50)] animate-pulse-ring"
                      :             "bg-[var(--color-cream-dark)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <span className={`text-[11px] mt-2 max-w-[90px] text-center truncate ${
                      isComplete  ? "text-[var(--color-brand)] font-semibold"
                      : isCurrent ? "text-[var(--color-accent)] font-semibold"
                      :             "text-[var(--color-text-muted)] font-medium"
                    }`}>{g.title}</span>
                  </Link>
                  {i < groups.length - 1 && (
                    <div className={`w-8 lg:w-12 h-[2px] mx-1.5 rounded-full transition-all ${isComplete ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Vertical stepper  mobile only */}
          <div className="flex md:hidden flex-col gap-0 mb-6">
            {groups.map((g, i) => {
              const isComplete = g.completed;
              const isCurrent  = !g.completed && (i === 0 || groups[i - 1]?.completed);
              const passed  = g.subModules.filter((m) => m.status === "PASSED").length;
              const total   = g.subModules.length;
              const percent = total ? Math.round((passed / total) * 100) : 0;
              return (
                <div key={g.id} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                      isComplete  ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                      : isCurrent ? "bg-white border-[var(--color-accent)] text-[var(--color-accent)]"
                      :             "bg-[var(--color-cream-dark)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    {i < groups.length - 1 && (
                      <div className={`w-[2px] flex-1 my-1 rounded-full min-h-[16px] ${isComplete ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]"}`} />
                    )}
                  </div>
                  <Link href={`/main-module/${g.id}`} className="flex-1 pb-4 group min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${
                        isComplete  ? "text-[var(--color-brand)]"
                        : isCurrent ? "text-[var(--color-accent)]"
                        :             "text-[var(--color-text-muted)]"
                      }`}>{g.title}</span>
                      <span className="text-xs text-[var(--color-text-muted)] shrink-0">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-cream-dark)] overflow-hidden mt-1.5">
                      <div className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-[var(--color-brand)]" : "bg-[var(--color-accent)]"}`} style={{ width: `${percent}%` }} />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/*  Module Cards Grid  */}
      {groups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {groups.map((g, idx) => {
            const total      = g.subModules.length;
            const passed     = g.subModules.filter((m) => m.status === "PASSED").length;
            const percent    = total ? Math.round((passed / total) * 100) : 0;
            const isComplete = g.completed;
            const isCurrent  = (!g.completed && idx === 0) || (idx > 0 && groups[idx - 1]?.completed && !g.completed);
            const isLocked   = !isComplete && !isCurrent && idx > 0 && !groups[idx - 1]?.completed;
            const hasFailed  = g.subModules.some((m) => m.status === "FAILED");
            const bestScore  = g.dashboardAverage;
            const nextSubTitle = g.subModules.find((m) => m.status === "PENDING")?.title;

            return (
              <Link
                href={`/main-module/${g.id}`}
                key={g.id}
                className={`group block rounded-[var(--radius-lg)] border overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 cursor-pointer shadow-[var(--shadow-card)] animate-fade-in-up [animation-delay:${idx * 80}ms] ${
                  hasFailed    ? "border-amber-300 bg-amber-50/40"
                  : isComplete ? "border-[var(--color-brand)]/25 bg-[var(--color-brand-50)]/30"
                  : isCurrent  ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md bg-[var(--color-accent-50)]/25"
                  :              "border-[var(--color-border)] bg-white"
                }`}
              >
                {/* Color strip */}
                <div className={`h-1.5 ${
                  hasFailed    ? "bg-amber-400"
                  : isComplete ? "bg-[var(--color-brand)]"
                  : isCurrent  ? "bg-[var(--color-accent)]"
                  :              "bg-[var(--color-border)]"
                }`} />

                <div className="flex flex-col sm:flex-row gap-4 p-4 md:p-5">
                  {/* Thumbnail  always reserve consistent space */}
                  <div className={`w-full sm:w-[140px] aspect-video sm:aspect-[140/79] shrink-0 rounded-[var(--radius)] overflow-hidden ${isComplete ? "opacity-70" : ""}`}>
                    {g.youtubeId ? (
                      <HoverVideoPreview videoId={g.youtubeId} title={g.title} className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-accent-50)] flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-[var(--color-brand)]/40" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-[var(--radius)] flex items-center justify-center text-xs font-bold shrink-0 ${
                          isComplete  ? "bg-[var(--color-brand)] text-white"
                          : isCurrent ? "bg-[var(--color-accent-50)] text-[var(--color-accent)]"
                          : hasFailed ? "bg-amber-100 text-amber-700"
                          :             "bg-[var(--color-cream-dark)] text-[var(--color-text-muted)]"
                        }`}>
                          {isComplete ? <CheckCircle2 className="w-4 h-4" /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : g.orderIndex}
                        </div>
                        <h3 className={`font-semibold text-base group-hover:text-[var(--color-brand)] transition-colors line-clamp-2 ${isComplete ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`} style={{ fontFamily: "var(--font-serif)" }}>
                          {g.title}
                        </h3>
                      </div>

                      {/* Status badge  with icon, readable size */}
                      <span className={`inline-flex items-center gap-1 shrink-0 px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                        hasFailed    ? "bg-amber-100 text-amber-700 border-amber-200"
                        : isComplete ? "bg-[var(--color-brand-50)] text-[var(--color-brand)] border-[var(--color-brand-100)]"
                        : isCurrent  ? "bg-[var(--color-accent-50)] text-[var(--color-accent-dark)] border-[var(--color-accent-100)]"
                        : isLocked   ? "bg-[var(--color-cream-dark)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                        :              "bg-[var(--color-cream-dark)] text-[var(--color-text-muted)] border-[var(--color-border)]"
                      }`}>
                        {hasFailed    ? <AlertTriangle className="w-3 h-3" /> : null}
                        {isComplete   ? <CheckCircle2  className="w-3 h-3" /> : null}
                        {isCurrent    ? <PlayCircle    className="w-3 h-3" /> : null}
                        {isLocked     ? <Lock          className="w-3 h-3" /> : null}
                        {hasFailed ? "Retry" : isComplete ? "Done" : isCurrent ? "Active" : isLocked ? "Locked" : "Pending"}
                      </span>
                    </div>

                    {/* Description */}
                    {g.description && (
                      <p className={`text-sm line-clamp-2 leading-relaxed mb-2 ${isComplete ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-light)]"}`}>
                        {g.description}
                      </p>
                    )}

                    {/* Locked notice */}
                    {isLocked && (
                      <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mb-2">
                        <Lock className="w-3 h-3 shrink-0" /> Complete the previous module to unlock
                      </p>
                    )}

                    {/* Meta row  lessons count + best score, NO fake clock estimate */}
                    <div className="flex items-center flex-wrap gap-3 text-xs text-[var(--color-text-muted)] mb-2">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {total} {total === 1 ? "lesson" : "lessons"}
                      </span>
                      {bestScore !== null && (
                        <span className={`flex items-center gap-1 font-semibold ${bestScore >= 70 ? "text-[var(--color-success)]" : "text-[var(--color-accent)]"}`}>
                          <Award className="w-3.5 h-3.5" />
                          Best: {bestScore}%
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${isComplete ? "bg-[var(--color-brand-100)]" : "bg-[var(--color-cream-dark)]"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-[var(--color-brand)]" : hasFailed ? "bg-amber-400" : "bg-[var(--color-accent)]"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-medium ${isComplete ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]"}`}>
                        {passed}/{total}  {percent}%
                      </span>
                      {nextSubTitle && !isComplete && !isLocked && (
                        <span className="text-xs text-[var(--color-text-muted)] font-medium truncate max-w-[150px] flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 shrink-0" />{nextSubTitle}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-all group-hover:translate-x-1 ${isComplete ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)]"}`} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );

  const ProfileInner = (
    <section className="animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-[var(--color-brown)]" style={{ fontFamily: "var(--font-serif)" }}>Profile</h2>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] max-w-[520px]">
        <ProfileForm />
      </div>
    </section>
  );

  const CertificateInner = (
    <section className="animate-fade-in">
      <h2 className="text-xl font-bold mb-4 text-[var(--color-brown)]" style={{ fontFamily: "var(--font-serif)" }}>Certificate</h2>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] max-w-[720px]">
        <CertificatePanel />
      </div>
    </section>
  );

  const isHomeView = ["dashboard", "profile", "certificate"].includes(view);
  const inner = view === "dashboard" ? DashboardInner : view === "profile" ? ProfileInner : CertificateInner;

  return (
    <main>
      {isHomeView ? (
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-[calc(100vh-56px)] w-full overflow-x-hidden">
          <aside className="bg-white border-b md:border-b-0 md:border-r border-[var(--color-border)] px-4 py-4 bg-leaves md:w-[240px] shrink-0">
            <UserSidebar />
          </aside>
          <section className="p-4 md:p-6 lg:p-8 min-w-0 overflow-x-hidden">{inner}</section>
        </div>
      ) : (
        <section className="p-4 md:p-6">{DashboardInner}</section>
      )}
    </main>
  );
}
