"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, User, Award, LogOut } from "lucide-react";

const items = [
  { href: "/?view=dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/?view=profile", label: "Profile", icon: User },
  { href: "/?view=certificate", label: "Certificate", icon: Award },
];

export default function UserSidebar() {
  const sp = useSearchParams();
  const view = sp.get("view") || "dashboard";

  return (
    <div className="flex flex-col h-full gap-3">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {items.map((it) => {
          const v = new URL(it.href, "http://x").searchParams.get("view") || "dashboard";
          const active = v === view;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`sidebar-link shrink-0 ${active ? "active" : ""}`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button at bottom */}
      <div className="hidden md:block mt-auto pt-4 border-t border-[var(--color-border)]">
        <button
          className="sidebar-link w-full text-[var(--color-error)] hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)] transition-all"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
