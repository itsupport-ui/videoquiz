"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { LotusIcon } from "@/components/ui/AyurvedaIcons";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot" || pathname === "/reset" || pathname === "/verify";
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  if (isAuthPage || !mounted) return null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[var(--color-border)] shadow-[0_1px_3px_rgba(92,70,54,0.04)]">
      {/* Accent strip */}
      <div className="h-1 bg-[var(--color-brand)]" />
      <div className="px-4 lg:px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <LotusIcon className="w-8 h-8 text-[var(--color-brand)] group-hover:scale-105 transition-transform" />
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-[var(--color-brand)] leading-tight tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
              AyurvedaOne
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-accent)] font-semibold leading-none">
              Training Portal
            </div>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        {!session ? (
          <Link href="/login" className="btn btn-primary text-sm">Login</Link>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-[var(--radius)] px-3 py-2 hover:bg-[var(--color-cream)] transition-colors"
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center text-sm font-semibold">
                {(session.user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm text-[var(--color-text)] font-medium max-w-[160px] truncate">
                {session.user?.name}
              </span>
              <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] py-1.5 min-w-[200px] animate-fade-in">
                  <div className="px-3 py-2 border-b border-[var(--color-border-light)]">
                    <p className="text-sm font-medium text-[var(--color-text)]">{session.user?.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{session.user?.email}</p>
                  </div>
                  <Link
                    href="/?view=profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-colors w-full text-left"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}


