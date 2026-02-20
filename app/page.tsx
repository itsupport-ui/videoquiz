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
  BookOpen, Target, Award, Clock, ChevronRight,
  CheckCircle2, Lock, PlayCircle, TrendingUp, Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ view?: string; design?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin");

  const sp = await searchParams;
  const view = sp.view || "dashboard";

  const groups = await getMainModuleProgress((session.user as any).id);
  const totalSubs = groups.reduce((s, g) => s + g.subModules.length, 0);
  const passedCount = groups.reduce((s, g) => s + g.subModules.filter((m) => m.status === "PASSED").length, 0);
  const allPassed = totalSubs > 0 && passedCount === totalSubs;
  const overallPct = totalSubs > 0 ? Math.round((passedCount / totalSubs) * 100) : 0;
  const completedModules = groups.filter(g => g.completed).length;

  const currentMainModule = groups.find(g => !g.completed);
  const nextSubModule = currentMainModule?.subModules.find(m => m.status === "PENDING");
  const attemptsLeft = nextSubModule ? Math.max(0, 2 - nextSubModule.attemptsUsed) : 0;

  const lastAttempt = await prisma.attempt.findFirst({
    where: { userId: (session.user as any).id },
    orderBy: { submittedAt: 'desc' }
  });

  let certificate: { eligible?: boolean; url?: string } = {};
  try {
    const res = await fetch(`/api/certificate`, { cache: "no-store" });
    if (res.ok) certificate = await res.json();
  } catch {}

  const userName = (session.user as any).name || "there";

  // ── Dashboard View ──
  const DashboardInner = (
    <div className="animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="rounded-[var(--radius-xl)] bg-[var(--color-brand-dark)] text-white p-6 md:p-8 mb-6 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-2 w-24 h-24 rounded-full bg-white/3" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <p className="text-white/85 text-sm mb-1" style={{textShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>Welcome back,</p>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {userName}
            </h1>
            <p className="text-white/85 text-sm max-w-md" style={{textShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
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
                <PlayCircle className="w-4 h-4" />
                Continue Learning
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
                  strokeLinecap="round" className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{overallPct}%</span>
                <span className="text-[10px] text-white/60 uppercase tracking-wider">Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-brand-100)]">
              <BookOpen className="w-6 h-6 text-[var(--color-brand)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Modules</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{passedCount}/{totalSubs}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-accent-50)] to-[var(--color-accent-100)]">
              <Target className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Main Modules</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{completedModules}/{groups.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-ochre-50)] to-[var(--color-ochre-100)]">
              <TrendingUp className="w-6 h-6 text-[var(--color-ochre)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Attempts Left</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">{attemptsLeft}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-success-light)] to-[var(--color-success-50)]">
              <Award className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Average</p>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {currentMainModule?.dashboardAverage !== null && currentMainModule?.dashboardAverage !== undefined ? `${currentMainModule.dashboardAverage}%` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* All Passed Banner */}
      {allPassed && (
        <div className="rounded-[var(--radius-lg)] border border-[#B7E4C7] bg-[var(--color-success-light)] p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-[#1B6B41] shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-[#1B6B41]">All modules complete!</p>
            <p className="text-sm text-[#2D7D4C]">
              {certificate.url
                ? "Your certificate is ready for download."
                : "Head to the Certificate section to claim yours."}
            </p>
          </div>
          <Link
            href={certificate.url || "/?view=certificate"}
            className="btn btn-primary text-sm shrink-0"
          >
            {certificate.url ? "Download" : "View Certificate"}
          </Link>
        </div>
      )}

      {/* Learning Path */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-brown)]" style={{ fontFamily: "var(--font-serif)" }}>
            Learning Path
          </h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {completedModules} of {groups.length} completed
          </span>
        </div>

        {/* Horizontal milestone track (desktop) */}
        <div className="hidden md:flex items-center gap-0 mb-6 overflow-x-auto pb-2">
          {groups.map((g, i) => {
            const isComplete = g.completed;
            const isCurrent = !g.completed && (i === 0 || groups[i - 1]?.completed);
            const total = g.subModules.length;
            const passed = g.subModules.filter((m) => m.status === 'PASSED').length;
            const percent = total ? Math.round((passed / total) * 100) : 0;
            return (
              <div key={g.id} className="flex items-center">
                <Link href={`/main-module/${g.id}`} className="flex flex-col items-center group relative" title={`${g.title} - ${percent}% complete`}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all hover:scale-110 ${
                    isComplete
                      ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                      : isCurrent
                      ? "bg-white border-[var(--color-accent)] text-[var(--color-accent)] shadow-[0_0_0_4px_var(--color-accent-50)] animate-pulse-ring"
                      : "bg-[var(--color-cream-dark)] border-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}>
                    {isComplete ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-[11px] mt-2 max-w-[90px] text-center truncate ${
                    isComplete ? "text-[var(--color-brand)] font-semibold" : isCurrent ? "text-[var(--color-accent)] font-semibold" : "text-[var(--color-text-muted)] font-medium"
                  }`}>
                    {g.title}
                  </span>
                </Link>
                {i < groups.length - 1 && (
                  <div className={`w-8 lg:w-12 h-[2px] mx-1.5 rounded-full transition-all ${
                    isComplete ? "bg-[var(--color-brand)]" : "bg-[var(--color-border)]"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {groups.map((g, idx) => {
          const total = g.subModules.length;
          const passed = g.subModules.filter((m) => m.status === 'PASSED').length;
          const percent = total ? Math.round((passed / total) * 100) : 0;
          const isComplete = g.completed;
          const isCurrent = !g.completed && groups.indexOf(g) === 0 || (groups.indexOf(g) > 0 && groups[groups.indexOf(g) - 1]?.completed && !g.completed);
          const currentSubTitle = g.subModules.find((m) => m.status === 'PENDING')?.title;
          const estimatedMinutes = total * 15; // 15 min per lesson estimate

          return (
            <Link
              href={`/main-module/${g.id}`}
              key={g.id}
              style={{ animationDelay: `${idx * 100}ms` }}
              className={`group block rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-card)] overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] animate-fade-in-up ${
                isCurrent
                  ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 shadow-md"
                  : isComplete
                  ? "border-[var(--color-brand)]/20"
                  : "border-[var(--color-border)]"
              }`}
            >
              {/* Color strip at top */}
              <div className={`h-1.5 ${isComplete ? "bg-[var(--color-brand)]" : isCurrent ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />

              <div className="flex flex-col sm:flex-row gap-4 p-4 md:p-5">
                {/* Video Thumbnail with Hover-to-Play */}
                {g.youtubeId && (
                  <HoverVideoPreview
                    videoId={g.youtubeId}
                    title={g.title}
                    className="w-full sm:w-[140px] aspect-video sm:aspect-[140/79] shrink-0"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Module number badge */}
                      <div className={`w-8 h-8 rounded-[var(--radius)] flex items-center justify-center text-xs font-bold shrink-0 ${
                        isComplete
                          ? "bg-[var(--color-brand-50)] text-[var(--color-brand)]"
                          : isCurrent
                          ? "bg-[var(--color-accent-50)] text-[var(--color-accent)]"
                          : "bg-[var(--color-cream-dark)] text-[var(--color-text-muted)]"
                      }`}>
                        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : g.orderIndex}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--color-text)] text-base group-hover:text-[var(--color-brand)] transition-colors line-clamp-1" style={{ fontFamily: "var(--font-serif)" }}>
                          {g.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`badge shrink-0 text-[10px] ${isComplete ? "badge-success" : isCurrent ? "badge-warning" : "badge-neutral"}`}>
                      {isComplete ? "Done" : isCurrent ? "Active" : "Pending"}
                    </span>
                  </div>

                  {/* Description */}
                  {g.description && (
                    <p className="text-sm text-[var(--color-text-light)] line-clamp-2 leading-relaxed mb-3">{g.description}</p>
                  )}

                  {/* Meta info */}
                  <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-3">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {total} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{estimatedMinutes} min
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-[var(--color-cream-dark)] overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 animate-progress-bar ${isComplete ? "bg-[var(--color-brand)]" : "bg-[var(--color-accent)]"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)] font-medium">
                      {passed}/{total} completed · {percent}%
                    </span>
                    {currentSubTitle && !isComplete && (
                      <span className="text-xs text-[var(--color-accent)] font-medium truncate max-w-[180px] flex items-center gap-1">
                        <PlayCircle className="w-3 h-3 shrink-0" />
                        {currentSubTitle}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-brand)] group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
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
