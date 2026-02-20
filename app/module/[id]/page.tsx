import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isModuleAccessible } from "@/lib/quiz";
import VideoGate from "@/components/VideoGate";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Play, BookOpen, ListChecks, Target, Clock, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id: moduleId } = await params;
  const ok = await isModuleAccessible((session.user as any).id, moduleId);
  if (!ok) redirect("/");
  const mod = await prisma.module.findUnique({ 
    where: { id: moduleId }, 
    include: { 
      quiz: {
        include: {
          questions: true
        }
      } 
    } 
  });
  if (!mod) redirect("/");

  const mainModuleId = (mod as any).mainModuleId;
  const quiz = mod.quiz;
  
  // Get attempt history
  const attempts = quiz ? await prisma.attempt.findMany({
    where: { 
      userId: (session.user as any).id, 
      quizId: quiz.id 
    },
    orderBy: { submittedAt: 'desc' },
    take: 5,
  }) : [];
  
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.score)) : 0;
  const attemptsCount = attempts.length;
  const lastAttempt = attempts[0];

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
            {mainModuleId && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/main-module/${mainModuleId}`} className="hover:text-[var(--color-brand)] transition-colors">
                  Main Module
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--color-text)] font-medium truncate">{mod.title}</span>
          </nav>
        </div>
      </div>

      {/* Two-column layout: Video + Sidebar */}
      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_380px] gap-0">
          {/* LEFT: Video & Content */}
          <div className="p-4 md:p-6 lg:border-r border-[var(--color-border)]">
            {/* Module header */}
            <div className="mb-5">
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 rounded-[var(--radius)] bg-[var(--color-accent-50)] shrink-0">
                  <Play className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wide">
                      Module {mod.order}
                    </span>
                    {attemptsCount > 0 && (
                      <span className="badge badge-sm bg-[var(--color-cream-dark)] text-[var(--color-text-muted)]">
                        {attemptsCount} attempt{attemptsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-brown)] leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                    {mod.title}
                  </h1>
                  {mod.description && (
                    <p className="text-[var(--color-text-muted)] leading-relaxed mt-2">{mod.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden mb-6">
              <Suspense fallback={<div className="aspect-video bg-[var(--color-cream-dark)] skeleton" />}>
                <VideoGate videoId={mod.youtubeId} moduleId={mod.id} />
              </Suspense>
            </div>

            {/* About this lesson */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] mb-6">
              <h3 className="text-lg font-bold text-[var(--color-brown)] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
                <BookOpen className="w-5 h-5 text-[var(--color-brand)]" />
                About This Lesson
              </h3>
              <p className="text-sm text-[var(--color-text-light)] leading-relaxed mb-4">
                {mod.description || "Watch the video carefully to understand the key concepts. After completion, you'll take a quiz to test your knowledge."}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)]">Duration</div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">~15 minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <div>
                    <div className="text-xs text-[var(--color-text-muted)]">Quiz Questions</div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">{quiz?.questions?.length || 0} questions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attempt History */}
            {attemptsCount > 0 && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                <h3 className="text-lg font-bold text-[var(--color-brown)] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
                  <Target className="w-5 h-5 text-[var(--color-accent)]" />
                  Your Progress
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-[var(--radius)] bg-[var(--color-brand-50)]">
                    <div className="text-2xl font-bold text-[var(--color-brand)]">{bestScore}%</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">Best Score</div>
                  </div>
                  <div className="text-center p-3 rounded-[var(--radius)] bg-[var(--color-accent-50)]">
                    <div className="text-2xl font-bold text-[var(--color-accent)]">{attemptsCount}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">Total Attempts</div>
                  </div>
                </div>
                {lastAttempt && (
                  <div className="text-xs text-[var(--color-text-muted)] text-center pt-3 border-t border-[var(--color-border)]">
                    Last attempt: {lastAttempt.score}% • {new Date(lastAttempt.submittedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Quiz Information Sidebar */}
          <div className="bg-[var(--color-cream)] p-4 md:p-6 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto min-w-0 overflow-x-hidden">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[var(--color-brown)] mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Quiz Requirements
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Complete this quiz to proceed
              </p>
            </div>

            {/* Quiz Info Card */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 mb-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-[var(--color-border)]">
                  <span className="text-sm text-[var(--color-text-muted)]">Questions</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{quiz?.questions?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                  <span className="text-sm text-[var(--color-text-muted)]">Passing Score</span>
                  <span className="text-sm font-semibold text-[var(--color-brand)]">{quiz?.passScore || 70}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Time Limit</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">No limit</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-accent)]/20 bg-[var(--color-accent-50)] p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-accent)] mb-1">Before You Start</h4>
                  <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                    <li>• Watch the complete video</li>
                    <li>• Understand key concepts</li>
                    <li>• Score {quiz?.passScore || 70}% or higher to pass</li>
                    <li>• You can retake if needed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Navigation hint */}
            {mainModuleId && (
              <Link
                href={`/main-module/${mainModuleId}`}
                className="block text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors p-3 rounded-[var(--radius)] hover:bg-white"
              >
                ← Back to Main Module
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

