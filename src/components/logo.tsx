export function Logo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Concentric arcs = a signal being picked up / "foreseen" before
          it fully arrives — ties the mark directly to the product idea
          (detecting what's coming) rather than a generic abstract shape. */}
      <circle cx="16" cy="16" r="3" fill="var(--fc-accent)" />
      <path
        d="M22 16a6 6 0 0 1-6 6"
        stroke="var(--fc-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M26 16a10 10 0 0 1-10 10"
        stroke="var(--fc-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M30 16A14 14 0 0 1 16 30"
        stroke="var(--fc-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}
