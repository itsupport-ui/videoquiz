import { EmptyStateIllustration } from "./AyurvedaIcons";

export default function EmptyState({
  title = "Nothing here yet",
  description = "Get started by creating your first item.",
  action,
  icon,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      {icon || <EmptyStateIllustration className="w-32 h-32 text-[var(--color-brand)] opacity-60 mb-4" />}
      <h3 className="text-lg font-semibold text-[var(--color-brown)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
