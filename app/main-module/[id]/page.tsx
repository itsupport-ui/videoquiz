import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMainModuleProgress } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { Suspense } from "react";
import {
  ArrowLeft, CheckCircle2, Lock, PlayCircle, XCircle, ChevronRight, Clock, BookOpen, Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MainModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const main = await (prisma as any).mainModule.findUnique({ where: { id: Number(id) } });
  if (!main) redirect("/");
  const tree = await getMainModuleProgress((session.user as any).id);
  const group = tree.find((g) => g.id === Number(id));
  const subs = group?.subModules || [];
  const passedCount = subs.filter((m) => m.status === "PASSED").length;
  const pct = subs.length ? Math.round((passedCount / subs.length) * 100) : 0;
  const nextPending = subs.find((m) => m.status === "PENDING");

  return (
    <main className="animate-fade-in overflow-x-hidden w-full">
      {/* Breadcrumb */}
      <div className="border-b border-[var(--color-border)] bg-white px-4 py-3">
        <div className="max-w-[1400px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Link href="/" className="hover:text-[var(--color-brand)] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--color-text)] font-medium truncate">{main.title}</span>
          </nav>
        </div>
      </div>

      {/* Two-column layout: Video + Sidebar */}
      <div className="max-w-[1400px] mx-auto w-full overflow-x-hidden">
        <div className="grid lg:grid-cols-[1fr_380px] gap-0 w-full">
          {/* LEFT: Video & Content */}
          <div className="p-4 md:p-6 lg:border-r border-[var(--color-border)] min-w-0 overflow-x-hidden">
            {/* Module header */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-brown)]" style={{ fontFamily: "var(--font-serif)" }}>
                  {main.title}
                </h1>
                <span className={`badge shrink-0 ${group?.completed ? "badge-success" : "badge-warning"}`}>
                  {group?.completed ? "Completed" : "In Progress"}
                </span>
              </div>
              {main.description && (
                <p className="text-[var(--color-text-muted)] leading-relaxed">{main.description}</p>
              )}

              {/* Progress bar */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-2.5 rounded-full bg-[var(--color-cream-dark)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${group?.completed ? "bg-[var(--color-brand)]" : "bg-[var(--color-accent)]"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-[var(--color-text)]">
                  {pct}%
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                {passedCount} of {subs.length} lessons completed
              </p>
            </div>

            {/* Video Player */}
            {main.youtubeId && (
              <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden mb-6">
                <Suspense fallback={<div className="aspect-video bg-[var(--color-cream-dark)] skeleton" />}>
                  <YouTubePlayer videoId={main.youtubeId} />
                </Suspense>
              </div>
            )}

            {/* About this module */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] mb-6">
              <h3 className="text-lg font-bold text-[var(--color-brown)] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
                <BookOpen className="w-5 h-5 text-[var(--color-brand)]" />
                About This Module
              </h3>
              <p className="text-sm text-[var(--color-text-light)] leading-relaxed mb-4">
                {main.description || "This module covers essential concepts in Ayurveda. Complete all lessons and quizzes to earn your certificate."}
              </p>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border)]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-brand)]">{subs.length}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-accent)]">{passedCount}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-ochre)]">{pct}%</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Progress</div>
                </div>
              </div>
            </div>

            {/* Certificate info (if completed) */}
            {group?.completed && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-brand)]/30 bg-[var(--color-brand-50)] p-5 shadow-[var(--shadow-card)] flex items-start gap-3">
                <Award className="w-6 h-6 text-[var(--color-brand)] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--color-brand)] mb-1">Module Complete!</h4>
                  <p className="text-sm text-[var(--color-brand)] opacity-90">
                    You&apos;ve completed all lessons. Continue to the next module or visit your certificate page.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Course Outline Sidebar */}
          <div className="bg-[var(--color-cream)] p-4 md:p-6 lg:max-h-screen lg:overflow-y-auto lg:sticky lg:top-0 min-w-0 overflow-x-hidden">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[var(--color-brown)] mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Course Content
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                {passedCount}/{subs.length} lessons · {pct}% complete
              </p>
            </div>

            {/* Continue button */}
            {nextPending && (
              <Link
                href={`/module/${nextPending.id}`}
                className="btn btn-accent w-full flex items-center justify-center gap-2 mb-4"
              >
                <PlayCircle className="w-4 h-4" />
                Continue Learning
              </Link>
            )}

            {/* Sub-modules list */}
            <div className="space-y-2">
              {subs.map((m, i) => {
                const isPending = m.status === "PENDING";
                const isPassed = m.status === "PASSED";
                const isFailed = m.status === "FAILED";
                const isLocked = !isPending && !isPassed && !isFailed;

                const card = (
                  <div className={`rounded-[var(--radius-lg)] border bg-white overflow-hidden transition-all ${
                    isPending
                      ? "border-[var(--color-accent)] shadow-[0_0_0_2px_var(--color-accent-50)]"
                      : isPassed
                      ? "border-[var(--color-brand)]/20"
                      : "border-[var(--color-border)] opacity-60"
                  }`}>
                    <div className="p-3">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Order number */}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                          isPassed
                            ? "bg-[var(--color-brand)] text-white"
                            : isPending
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>

                        {/* Title */}
                        <h4 className="font-semibold text-sm text-[var(--color-text)] flex-1 line-clamp-2 leading-snug">
                          {m.title}
                        </h4>

                        {/* Status icon */}
                        {isLocked && <Lock className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                        {isPending && <PlayCircle className="w-4 h-4 text-[var(--color-accent)] shrink-0" />}
                        {isFailed && <XCircle className="w-4 h-4 text-[var(--color-error)] shrink-0" />}
                      </div>

                      {/* Description */}
                      {m.description && (
                        <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed ml-9">
                          {m.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-2 ml-9 text-[10px] text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          15 min
                        </span>
                        {isPassed && (
                          <span className="flex items-center gap-1 text-[var(--color-brand)]">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-[var(--color-error)]">
                            Quiz failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return isPending ? (
                  <Link href={`/module/${m.id}`} key={m.id} className="block hover:scale-[1.01] transition-transform">
                    {card}
                  </Link>
                ) : (
                  <div key={m.id}>{card}</div>
                );
              })}

              {subs.length === 0 && (
                <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                  No lessons in this module yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
