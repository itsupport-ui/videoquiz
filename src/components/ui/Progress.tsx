export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = false,
  color = "brand",
}: {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  color?: "brand" | "accent" | "success";
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };
  const colors = {
    brand: "bg-[var(--color-brand)]",
    accent: "bg-[var(--color-accent)]",
    success: "bg-[var(--color-success)]",
  };
  return (
    <div className="w-full">
      <div className={`w-full ${heights[size]} rounded-full bg-[var(--color-cream-dark)] overflow-hidden`}>
        <div
          className={`h-full rounded-full ${colors[color]} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-[var(--color-text-secondary)] mt-1">{pct}%</div>
      )}
    </div>
  );
}

export function ProgressRing({
  value,
  max = 100,
  size = 100,
  strokeWidth = 8,
  color = "brand",
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: "brand" | "accent" | "success";
  children?: React.ReactNode;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const R = (size - strokeWidth * 2) / 2;
  const C = 2 * Math.PI * R;
  const dash = Math.max(0.001, pct) * C;
  const gap = C - dash;
  const colors = {
    brand: "var(--color-brand)",
    accent: "var(--color-accent)",
    success: "var(--color-success)",
  };
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke="var(--color-cream-dark)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={R}
          fill="none" stroke={colors[color]} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
