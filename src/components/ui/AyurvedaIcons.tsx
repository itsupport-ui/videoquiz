/* Ayurveda-themed SVG illustrations and decorative elements */

export function LotusIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8C32 8 24 20 24 32C24 38 27.5 42 32 44C36.5 42 40 38 40 32C40 20 32 8 32 8Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M32 44C32 44 20 38 14 28C10 22 12 16 16 14C20 12 26 16 32 24" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M32 44C32 44 44 38 50 28C54 22 52 16 48 14C44 12 38 16 32 24" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M32 44V56" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 52C26 52 29 48 32 48C35 48 38 52 38 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function LeafIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 8C8 10 5.9 16.3 4 22C4 22 8 18 13 17C18 16 22 12 22 7C22 2 17 8 17 8Z" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 2L8.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 18C6 18 9.5 14 14.5 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function MortarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 14C6 14 4 16 4 18C4 20 6 22 12 22C18 22 20 20 20 18C20 16 18 14 18 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 14H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 14C4 14 6 12 12 12C18 12 20 14 20 14" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 6L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="17" cy="5" r="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
}

export function HerbIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 12C12 12 8 10 6 6C6 6 10 6 12 8" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 8C12 8 16 6 18 2C18 2 14 2 12 4" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16C12 16 16 14 18 10C18 10 14 10 12 12" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function MandalaSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="0.5" opacity="0.08"/>
      <circle cx="200" cy="200" r="140" stroke="currentColor" strokeWidth="0.5" opacity="0.07"/>
      <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="0.5" opacity="0.06"/>
      <circle cx="200" cy="200" r="60" stroke="currentColor" strokeWidth="0.5" opacity="0.05"/>
      <circle cx="200" cy="200" r="20" stroke="currentColor" strokeWidth="0.5" opacity="0.04"/>
      {/* Radial lines */}
      {[0,30,60,90,120,150].map(deg => (
        <line key={deg} x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="0.3" opacity="0.05" transform={`rotate(${deg} 200 200)`}/>
      ))}
      {/* Petal shapes */}
      {[0,45,90,135,180,225,270,315].map(deg => (
        <ellipse key={`p${deg}`} cx="200" cy="120" rx="12" ry="30" stroke="currentColor" strokeWidth="0.5" opacity="0.05" transform={`rotate(${deg} 200 200)`}/>
      ))}
    </svg>
  );
}

export function LeafDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-[var(--color-border)]"/>
      <LeafIcon className="w-4 h-4 text-[var(--color-brand)] opacity-40 rotate-45"/>
      <div className="flex-1 h-px bg-[var(--color-border)]"/>
    </div>
  );
}

/* Empty state illustration */
export function EmptyStateIllustration({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pot */}
      <path d="M60 140C60 140 55 160 60 170C65 180 135 180 140 170C145 160 140 140 140 140" fill="#E8C9A6" stroke="#D97742" strokeWidth="2"/>
      <rect x="55" y="134" width="90" height="10" rx="3" fill="#D97742" opacity="0.3" stroke="#D97742" strokeWidth="1.5"/>
      {/* Plant stem */}
      <path d="M100 134V80" stroke="#2D6A4F" strokeWidth="2" strokeLinecap="round"/>
      {/* Leaves */}
      <path d="M100 100C100 100 85 90 78 75C78 75 90 78 100 88" fill="#2D6A4F" opacity="0.15" stroke="#2D6A4F" strokeWidth="1.5"/>
      <path d="M100 88C100 88 115 78 122 63C122 63 110 66 100 76" fill="#2D6A4F" opacity="0.15" stroke="#2D6A4F" strokeWidth="1.5"/>
      <path d="M100 112C100 112 118 105 126 92C126 92 114 95 100 105" fill="#2D6A4F" opacity="0.15" stroke="#2D6A4F" strokeWidth="1.5"/>
      {/* Small flower */}
      <circle cx="100" cy="72" r="6" fill="#D97742" opacity="0.3" stroke="#D97742" strokeWidth="1"/>
      <circle cx="100" cy="72" r="2.5" fill="#D4A574"/>
    </svg>
  );
}
