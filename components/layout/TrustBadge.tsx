interface TrustBadgeProps {
  variant?: "pill" | "inline";
  className?: string;
}

/**
 * UN/ECOSOC trust signal badge — required on all public pages.
 * Registration number: IT 28744 | Status granted 2019
 */
export function TrustBadge({
  variant = "pill",
  className = "",
}: TrustBadgeProps) {
  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium text-[var(--yif-gold)] ${className}`}
      >
        <UNIcon />
        UN/ECOSOC Special Consultative Status · Reg. IT 28744
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--yif-gold)]/40 bg-[var(--yif-gold)]/10 px-3 py-1 text-xs font-medium text-[var(--yif-gold)] ${className}`}
    >
      <UNIcon />
      UN/ECOSOC Consultative Status · Reg. IT 28744
    </span>
  );
}

function UNIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 2C12 2 8 7 8 12s4 10 4 10M12 2c0 0 4 5 4 10s-4 10-4 10M2 12h20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 7h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
