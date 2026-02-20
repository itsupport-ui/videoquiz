import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CheckCircle2, XCircle, RotateCcw, Home, HelpCircle, Award, Target, Hash,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Results({ params, searchParams }: { params: Promise<{ moduleId: string }>, searchParams: Promise<{ score?: string, passed?: string, tq?: string, ta?: string, tc?: string, tw?: string, req?: string, rem?: string, an?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { moduleId } = await params;
  const sp = await searchParams;
  const score = Number(sp.score ?? 0);
  const passed = sp.passed === "1";
  const totalQuestions = Number(sp.tq ?? 0);
  const totalAnswered = Number(sp.ta ?? 0);
  const totalCorrect = Number(sp.tc ?? 0);
  const totalWrong = Number(sp.tw ?? Math.max(0, totalAnswered - totalCorrect));
  const passScore = Number(sp.req ?? 0);
  const attemptsRemaining = Number(sp.rem ?? 0);
  const attemptNo = Number(sp.an ?? 0);

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { title: true, order: true } });

  const pct = Math.max(0, Math.min(100, score)) / 100;
  const R = 44;
  const C = 2 * Math.PI * R;
  const dash = Math.max(0.001, pct) * C;

  return (
    <main className="max-w-[640px] mx-auto p-4 md:p-6 animate-fade-in">
      {/* Result Card */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
        {/* Color strip */}
        <div className={`h-2 ${passed ? "bg-[var(--color-brand)]" : "bg-[var(--color-error)]"}`} />

        <div className="p-5 md:p-8 text-center">
          {/* Title */}
          <p className="text-sm text-[var(--color-text-muted)] mb-1">
            {mod?.order ? `Module ${mod.order}: ` : ""}{mod?.title || "Module"}
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-brown)] mb-6" style={{ fontFamily: "var(--font-serif)" }}>
            Quiz Results
          </h1>

          {/* Score Ring */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-cream-dark)" strokeWidth="10" />
                <circle cx="60" cy="60" r={R} fill="none"
                  stroke={passed ? "var(--color-brand)" : "var(--color-error)"} strokeWidth="10"
                  strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[var(--color-text)]">{score}%</span>
              </div>
            </div>
          </div>

          {/* Pass/Fail badge */}
          <div className="flex justify-center mb-5">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
              passed
                ? "bg-[var(--color-success-light)] text-[#1B6B41]"
                : "bg-[var(--color-error-light)] text-[var(--color-error)]"
            }`}>
              {passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              {passed ? "Passed" : "Failed"}
              <span className="font-normal opacity-70">(Required ≥ {passScore}%)</span>
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 bg-[var(--color-cream)]">
              <HelpCircle className="w-4 h-4 text-[var(--color-text-muted)] mx-auto mb-1" />
              <p className="text-xs text-[var(--color-text-muted)]">Questions</p>
              <p className="text-lg font-bold text-[var(--color-text)]">{totalQuestions}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 bg-[var(--color-cream)]">
              <Target className="w-4 h-4 text-[var(--color-brand)] mx-auto mb-1" />
              <p className="text-xs text-[var(--color-text-muted)]">Correct</p>
              <p className="text-lg font-bold text-[var(--color-brand)]">{totalCorrect}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 bg-[var(--color-cream)]">
              <XCircle className="w-4 h-4 text-[var(--color-error)] mx-auto mb-1" />
              <p className="text-xs text-[var(--color-text-muted)]">Wrong</p>
              <p className="text-lg font-bold text-[var(--color-error)]">{totalWrong}</p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 bg-[var(--color-cream)]">
              <Hash className="w-4 h-4 text-[var(--color-ochre)] mx-auto mb-1" />
              <p className="text-xs text-[var(--color-text-muted)]">Attempt</p>
              <p className="text-lg font-bold text-[var(--color-ochre)]">#{attemptNo}</p>
            </div>
          </div>

          {/* Message */}
          <div className={`rounded-[var(--radius-lg)] p-4 mb-5 text-sm ${
            passed ? "bg-[var(--color-success-light)] text-[#1B6B41]" : "bg-[var(--color-error-light)] text-[var(--color-error)]"
          }`}>
            {passed ? (
              <p><strong>Congratulations!</strong> You have successfully passed this module quiz.</p>
            ) : attemptsRemaining > 0 ? (
              <p>You didn&apos;t pass this time. You have <strong>{attemptsRemaining} attempt{attemptsRemaining > 1 ? "s" : ""}</strong> remaining.</p>
            ) : (
              <p>You have used all your attempts for this quiz. Please contact your administrator.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            {passed ? (
              <Link href="/" className="btn btn-primary flex items-center gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            ) : attemptsRemaining > 0 ? (
              <>
                <Link href={`/module/${moduleId}`} className="btn btn-accent flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Link>
                <Link href="/" className="btn btn-ghost flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
              </>
            ) : (
              <Link href="/" className="btn btn-primary flex items-center gap-2">
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

