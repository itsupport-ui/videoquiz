"use client";
import { useState } from "react";
import { Mail, Send, ArrowLeft } from "lucide-react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Request failed");
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-[var(--color-cream)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-ochre)] text-white mb-3">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-brand)]" style={{ fontFamily: "var(--font-serif)" }}>
            AyurvedaOne
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">Training Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)] p-6 md:p-8">
          <h1 className="text-xl font-bold text-[var(--color-brown)] mb-1 text-center" style={{ fontFamily: "var(--font-serif)" }}>
            Forgot Password
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-5">
            Enter your email. If it exists, we&apos;ll send a reset link.
          </p>

          <form onSubmit={submit} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  className="input pl-10"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>
            <button
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
              type="submit"
              disabled={busy || !email}
            >
              <Send className="w-4 h-4" />
              Send Reset Link
            </button>
            {done && <div className="alert alert-success text-sm">If that email exists, a link has been sent.</div>}
            {error && <div className="alert alert-error text-sm">{error}</div>}
          </form>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-center">
            <a className="text-sm text-[var(--color-brand)] hover:underline inline-flex items-center gap-1" href="/login">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

