import { TrustBadge } from "@/components/layout/TrustBadge";
import Link from "next/link";

export function AboutHero() {
  return (
    <section className="relative min-h-[80vh] bg-[var(--yif-navy)] flex items-end overflow-hidden">
      {/* Adinkra pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pattern-adinkra opacity-70"
      />

      {/* Decorative concentric rings — top-right */}
      <svg
        aria-hidden
        className="absolute -top-20 -right-20 w-[520px] h-[520px] opacity-[0.06]"
        viewBox="0 0 520 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[40, 90, 140, 195, 250].map((r) => (
          <circle
            key={r}
            cx="260"
            cy="260"
            r={r}
            stroke="#c9913d"
            strokeWidth="1.5"
          />
        ))}
        {/* spokes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x2 = 260 + 250 * Math.cos(angle);
          const y2 = 260 + 250 * Math.sin(angle);
          return (
            <line
              key={i}
              x1="260"
              y1="260"
              x2={x2}
              y2={y2}
              stroke="#c9913d"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* Decorative vertical accent bar — left edge */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--yif-gold), transparent)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-40 pb-24 w-full">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-white/70 transition-colors">
            Home
          </Link>
          <span aria-hidden>/</span>
          <span className="text-white/70">About Us</span>
        </nav>

        {/* Trust badge */}
        <div className="mb-6">
          <TrustBadge variant="pill" />
        </div>

        {/* Eyebrow */}
        <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-5 animate-fade-up">
          Established 2005 · Reg. IT 28744
        </p>

        {/* Headline */}
        <h1
          className="font-display font-semibold text-white leading-[0.95] tracking-tight animate-fade-up"
          style={{
            fontSize: "clamp(3rem, 9vw, 6.5rem)",
            animationDelay: "80ms",
          }}
        >
          Rooted in{" "}
          <em className="not-italic text-[var(--yif-gold)]">Heritage</em>.
          <br />
          United in{" "}
          <em className="not-italic text-[var(--yif-gold)]">Purpose</em>.
        </h1>

        {/* Yoruba tagline */}
        <p
          className="font-display italic text-white/50 mt-6 mb-12 animate-fade-up"
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
            animationDelay: "180ms",
          }}
        >
          "Fun Isokan, Idagbasoke ati Ilosiwaju Omo Yoruba Lapapo"
        </p>

        {/* Quick facts strip */}
        <div
          className="flex flex-wrap gap-6 sm:gap-10 animate-fade-up"
          style={{ animationDelay: "280ms" }}
        >
          {[
            { figure: "2005", label: "Year Founded" },
            { figure: "2019", label: "UN/ECOSOC Status" },
            { figure: "19+", label: "Countries Represented" },
            { figure: "IT 28744", label: "Registration No." },
          ].map(({ figure, label }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-display text-2xl sm:text-3xl font-semibold text-[var(--yif-gold)]">
                {figure}
              </span>
              <span className="text-xs text-white/50 uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(26,39,68,0.6))",
        }}
      />
    </section>
  );
}
