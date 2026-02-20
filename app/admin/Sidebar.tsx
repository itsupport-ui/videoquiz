"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, User, Users, Layers, Package, ClipboardList,
  HelpCircle, BarChart3, Award, Settings, LogOut,
} from "lucide-react";

const items = [
  { href: "/admin?view=dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin?view=users", label: "Users", icon: Users },
  { href: "/admin?view=main-modules", label: "Main Modules", icon: Package },
  { href: "/admin?view=modules", label: "Sub-Modules", icon: Layers },
  { href: "/admin?view=quizzes", label: "Quizzes", icon: ClipboardList },
  { href: "/admin?view=questions", label: "Questions", icon: HelpCircle },
  { href: "/admin?view=reports", label: "Reports", icon: BarChart3 },
  { href: "/admin?view=certificates", label: "Certificates", icon: Award },
  { href: "/admin?view=settings", label: "Settings", icon: Settings },
  { href: "/admin?view=profile", label: "Profile", icon: User },
];

export default function AdminSidebar() {
  const sp = useSearchParams();
  const view = sp.get("view") || "dashboard";
  return (
    <div className="flex flex-col h-full">
      <nav className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
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

      <div className="hidden md:block mt-auto pt-4 border-t border-[var(--color-border-light)]">
        <button
          className="sidebar-link w-full text-[var(--color-error)] hover:bg-[var(--color-error-light)] hover:text-[var(--color-error)]"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
