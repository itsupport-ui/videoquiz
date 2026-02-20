"use client";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Send, Loader2, AlertTriangle, BookOpen,
} from "lucide-react";

type Option = { key: number; text: string };
type Question = { id: string; text: string; options: Option[] };

export default function QuizPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [meta, setMeta] = useState<{ passScore: number; title: string } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | undefined>>({});
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const storageKey = useMemo(() => `quiz:${moduleId}`, [moduleId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/quiz/${moduleId}`);
      if (!res.ok) {
        setError((await res.json().catch(() => ({ message: "Failed" }))).message || "Failed to load quiz");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setQuestions(data.questions);
      setMeta({ passScore: data.quiz.passScore, title: data.module.title });
      setLoading(false);
    }
    load();
  }, [moduleId]);

  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    if (!meta) return;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (raw) {
        const saved = JSON.parse(raw) as { answers?: Record<string, number>; index?: number };
        if (saved.answers && typeof saved.answers === "object") setAnswers(saved.answers);
        if (typeof saved.index === "number") setIndex(Math.min(Math.max(0, saved.index), Math.max(0, (questions?.length ?? 1) - 1)));
      } else {
        if (typeof window !== "undefined") localStorage.setItem(storageKey, JSON.stringify({ answers: {}, index: 0 }));
      }
    } catch {}
  }, [meta, storageKey, questions?.length]);

  async function submit() {
    if (submitted) return;
    setSubmitted(true);
    const payload = { moduleId, answers: questions.map((q) => ({ questionId: q.id, optionKey: answers[q.id] })) };
    const res = await fetch("/api/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setSubmitted(false);
      setError((await res.json().then((d: any) => d.message).catch(() => "Submit failed")) || "Submit failed");
      return;
    }
    const data = await res.json();
    try { if (typeof window !== "undefined") localStorage.removeItem(storageKey); } catch {}
    const params = new URLSearchParams({
      score: String(data.score),
      passed: data.passed ? "1" : "0",
      tq: String(data.totalQuestions ?? 0),
      ta: String(data.totalAnswered ?? 0),
      tc: String(data.totalCorrect ?? 0),
      tw: String(Math.max(0, (data.totalAnswered ?? 0) - (data.totalCorrect ?? 0))),
      req: String(data.passScore ?? 0),
      rem: String(data.attemptsRemaining ?? 0),
      an: String(data.attemptNo ?? 0),
    }).toString();
    router.replace(`/results/${moduleId}?${params}`);
  }

  const total = questions.length;
  const answeredCount = questions.reduce((n, q) => (answers[q.id] != null ? n + 1 : n), 0);
  const allAnswered = total > 0 && answeredCount === total;

  function jumpTo(i: number) {
    const next = Math.min(Math.max(0, i), Math.max(0, total - 1));
    setIndex(next);
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(storageKey);
        const saved = raw ? JSON.parse(raw) : {};
        saved.index = next;
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }
    } catch {}
  }

  function selectOption(qId: string, optKey: number) {
    setAnswers((a) => {
      const next = { ...a, [qId]: optKey };
      try {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(storageKey);
          const saved = raw ? JSON.parse(raw) : {};
          saved.answers = next;
          localStorage.setItem(storageKey, JSON.stringify(saved));
        }
      } catch {}
      return next;
    });
  }

  /* ── Loading / Error States ── */
  if (loading) return (
    <main className="max-w-[800px] mx-auto p-4 md:p-6">
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)] text-center">
        <Loader2 className="w-8 h-8 text-[var(--color-brand)] mx-auto animate-spin mb-3" />
        <p className="text-[var(--color-text-muted)]">Loading quiz…</p>
      </div>
    </main>
  );

  if (error) return (
    <main className="max-w-[800px] mx-auto p-4 md:p-6">
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-error)]/30 bg-[var(--color-error-light)] p-6 shadow-[var(--shadow-card)] text-center">
        <AlertTriangle className="w-8 h-8 text-[var(--color-error)] mx-auto mb-3" />
        <p className="text-[var(--color-error)] font-medium">{error}</p>
      </div>
    </main>
  );

  if (!meta) return null;
  const current = questions[index];

  /* ── Progress ring ── */
  const pct = total > 0 ? answeredCount / total : 0;
  const R = 36;
  const C = 2 * Math.PI * R;
  const dash = Math.max(0.001, pct) * C;

  return (
    <main className="max-w-[800px] mx-auto p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-[var(--radius)] bg-[var(--color-brand-50)]">
          <BookOpen className="w-5 h-5 text-[var(--color-brand)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-[var(--color-brown)] truncate" style={{ fontFamily: "var(--font-serif)" }}>
            Quiz: {meta.title}
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Answer all {total} questions, then submit. Required ≥ {meta.passScore}%
          </p>
        </div>
      </div>

      {/* Quiz Card */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
        {/* Top bar: question nav dots + submit */}
        <div className="border-b border-[var(--color-border)] p-4 flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-cream-dark)" strokeWidth="8" />
              <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-brand)" strokeWidth="8"
                strokeDasharray={`${dash} ${C - dash}`} strokeLinecap="round" className="transition-all duration-300" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--color-text)]">
              {answeredCount}/{total}
            </div>
          </div>

          {/* Question nav pills */}
          <div className="flex-1 flex flex-wrap gap-1">
            {questions.map((q, i) => {
              const isCurrent = i === index;
              const isDone = answers[q.id] != null;
              return (
                <button
                  key={q.id}
                  onClick={() => jumpTo(i)}
                  className={`w-7 h-7 rounded-[var(--radius)] text-[11px] font-semibold transition-all ${
                    isCurrent
                      ? "bg-[var(--color-brand)] text-white shadow-sm"
                      : isDone
                      ? "bg-[var(--color-brand-50)] text-[var(--color-brand)] hover:bg-[var(--color-brand)]/20"
                      : "bg-[var(--color-cream-dark)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            className="btn btn-primary text-sm shrink-0 flex items-center gap-2 disabled:opacity-50"
            onClick={submit}
            disabled={submitted || !allAnswered}
          >
            {submitted ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit
          </button>
        </div>

        {/* Question Area */}
        <div className="p-5 md:p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="badge badge-neutral text-[10px]">Question {index + 1} of {total}</span>
          </div>
          <p className="text-base font-semibold text-[var(--color-text)] mb-5 leading-relaxed">{current.text}</p>

          {/* Options */}
          <div className="grid gap-2.5">
            {current.options.map((opt, i) => {
              const checked = answers[current.id] === opt.key;
              const letter = String.fromCharCode(65 + i);
              return (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3 cursor-pointer select-none transition-all ${
                    checked
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-50)] shadow-sm"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-cream)]"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    className="sr-only"
                    checked={checked}
                    onChange={() => selectOption(current.id, opt.key)}
                  />
                  <span
                    className={`grid place-items-center w-8 h-8 rounded-[var(--radius)] border text-xs font-bold transition-all ${
                      checked
                        ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className={`text-sm leading-snug ${checked ? "font-semibold text-[var(--color-text)]" : "text-[var(--color-text-light)]"}`}>
                    {opt.text}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation footer */}
        <div className="border-t border-[var(--color-border)] p-4 flex items-center justify-between">
          <button
            className="btn btn-ghost text-sm flex items-center gap-1 disabled:opacity-40"
            onClick={() => jumpTo(index - 1)}
            disabled={index === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-xs text-[var(--color-text-muted)]">
            {answeredCount} of {total} answered
          </span>
          <button
            className="btn btn-ghost text-sm flex items-center gap-1 disabled:opacity-40"
            onClick={() => jumpTo(index + 1)}
            disabled={index >= total - 1}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
