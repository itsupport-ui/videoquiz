"use client";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

type Crumb = { label: string; href?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] mb-4 flex-wrap">
      <Link href="/" className="flex items-center gap-1 hover:text-[var(--color-brand)] transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-[var(--color-brand)] transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text)] font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
