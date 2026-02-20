"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound, ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function ResetPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setToken(sp.get("token") || ""); }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Reset failed");
      setDone(true);
      setTimeout(()=> router.push("/login"), 1000);
    } catch (e: any) { setError(e?.message || "Reset failed"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-[var(--color-cream)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-brand)] text-white mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-brand)]" style={{ fontFamily: "var(--font-serif)" }}>
            AyurvedaOne
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">Training Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)] p-6 md:p-8">
          <h1 className="text-xl font-bold text-[var(--color-brown)] mb-1 text-center" style={{ fontFamily: "var(--font-serif)" }}>
            Reset Password
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-5">
            Choose a new password for your account
          </p>

          {!token ? (
            <div className="alert alert-warning text-sm">
              Missing token. Please use the link from your email.
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-[var(--color-text)]">New Password</span>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input className="input pl-10 pr-10" type={showPassword ? "text" : "password"} placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
              <button className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-50" type="submit" disabled={busy || !password}>
                <ShieldCheck className="w-4 h-4" />
                Update Password
              </button>
              {done && <div className="alert alert-success text-sm">Password updated. Redirecting to login…</div>}
              {error && <div className="alert alert-error text-sm">{error}</div>}
            </form>
          )}

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

