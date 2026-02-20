"use client";
import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogIn, Mail, Lock, RefreshCw, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  
  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const err = sp.get("error");
  let errMsg: string | null = null;
  if (err === "CredentialsSignin") {
    errMsg = "Sign-in failed. Check email/password. Please ensure your email is verified or reset your password if locked.";
  } else if (err) {
    errMsg = "Sign-in error. Please try again.";
  }

  const handleLogin = async () => {
    const body = { 
      email, 
      password, 
      callbackUrl:"/" 
    };
    await signIn("credentials", body);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-[var(--color-cream)]">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-brand)] text-white mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-brand)]" style={{ fontFamily: "var(--font-serif)" }}>
            AyurvedaOne
          </h2>
          <p className="text-sm text-[var(--color-text-muted)]">Training Portal</p>
        </div>

        {/* Login Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-elevated)] p-6 md:p-8">
          <h1 className="text-xl font-bold text-[var(--color-brown)] mb-1 text-center" style={{ fontFamily: "var(--font-serif)" }}>
            Welcome Back
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] text-center mb-5">Sign in to continue your training</p>

          {errMsg && (
            <div className="alert alert-error mb-4 text-sm">{errMsg}</div>
          )}

          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  className="input pl-10"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-[var(--color-text)]">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
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
            <button
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              onClick={handleLogin}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-sm justify-center">
            <a className="text-[var(--color-brand)] hover:underline" href="/forgot">Forgot password?</a>
            <button
              className="text-[var(--color-text-muted)] hover:text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
              onClick={async () => {
                if (!email) return alert('Enter email above to resend');
                try {
                  await fetch('/api/auth/verify/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                  alert('If that email exists, a verification link was sent.');
                } catch {}
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend verification
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

