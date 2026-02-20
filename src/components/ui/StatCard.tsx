import { type ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  color?: "brand" | "accent" | "ochre" | "brown";
};

const colorMap = {
  brand: { bg: "bg-[var(--color-brand-50)]", icon: "text-[var(--color-brand)]", border: "border-[var(--color-brand)]/10" },
  accent: { bg: "bg-[var(--color-accent-50)]", icon: "text-[var(--color-accent)]", border: "border-[var(--color-accent)]/10" },
  ochre: { bg: "bg-[var(--color-ochre-50)]", icon: "text-[var(--color-ochre)]", border: "border-[var(--color-ochre)]/10" },
  brown: { bg: "bg-[var(--color-cream-dark)]", icon: "text-[var(--color-brown)]", border: "border-[var(--color-border)]" },
};

export default function StatCard({ label, value, icon, trend, color = "brand" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`rounded-[var(--radius-lg)] border ${c.border} bg-white p-5 shadow-[var(--shadow-card)] card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text)]">{value}</p>
          {trend && <p className="text-xs text-[var(--color-text-muted)] mt-1">{trend}</p>}
        </div>
        {icon && (
          <div className={`${c.bg} ${c.icon} p-2.5 rounded-[var(--radius)]`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
