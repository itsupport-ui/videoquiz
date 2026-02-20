"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserPlus, KeyRound, User, Eye, EyeOff } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SignupPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    setToken(sp.get("token") || "");
  }, [sp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) { setError("Missing invite token"); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.message || "Signup failed");
      setDone(true);
      router.push("/signup/success");
    } catch (e: any) {
      setError(e?.message || "Signup failed");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-[var(--color-cream)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-accent)] text-white mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-brand)]" style={{ fontFamily: "var(--font-serif)" }}>
            AyurvedaOne
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">Training Portal</p>
        </div>

        {/* Signup Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)] p-6 md:p-8">
          <h1 className="text-xl font-bold text-[var(--color-brown)] mb-1 text-center" style={{ fontFamily: "var(--font-serif)" }}>
            Complete Signup
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-5">Set up your account to begin training</p>

          {!token ? (
            <div className="alert alert-warning text-sm">
              Missing invite token. Please open the link from your email.
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-[var(--color-text)]">Your Name</span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input className="input pl-10" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-[var(--color-text)]">Create Password</span>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input className="input pl-10 pr-10" placeholder="Choose a strong password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
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
              <button className="btn btn-accent w-full flex items-center justify-center gap-2 py-2.5" type="submit" disabled={busy || !name || !password}>
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
              {error && <div className="alert alert-error text-sm">{error}</div>}
              {done && <div className="alert alert-success text-sm">Account created. Redirecting…</div>}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

