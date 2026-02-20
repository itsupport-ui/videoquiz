"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MailCheck, ArrowLeft, Loader2 } from "lucide-react";

export default function VerifyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setToken(sp.get("token") || ""); }, [sp]);

  async function verify() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Verification failed");
      setDone(true);
      setTimeout(()=> router.push("/login"), 800);
    } catch (e: any) { setError(e?.message || "Verification failed"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-[var(--color-cream)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-brand)] text-white mb-3">
            <MailCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-brand)]" style={{ fontFamily: "var(--font-serif)" }}>
            AyurvedaOne
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">Training Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)] p-6 md:p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--color-brown)] mb-1" style={{ fontFamily: "var(--font-serif)" }}>
            Email Verification
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-5">
            Click below to verify your email address
          </p>

          {!token ? (
            <div className="alert alert-warning text-sm">
              Missing token. Please use the link from your email.
            </div>
          ) : (
            <div className="grid gap-4">
              <button
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
                onClick={verify}
                disabled={busy}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                {busy ? "Verifying…" : "Verify My Email"}
              </button>
              {done && <div className="alert alert-success text-sm">Email verified. You can log in now. Redirecting…</div>}
              {error && <div className="alert alert-error text-sm">{error}</div>}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
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

