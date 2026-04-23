import { TrustBadge } from "@/components/layout/TrustBadge";

export function ProgramsHero() {
  return (
    <section className="relative bg-[var(--yif-navy)] min-h-[60vh] flex items-end overflow-hidden">
      {/* Adinkra pattern texture */}
      <div
        aria-hidden
        className="absolute inset-0 pattern-adinkra opacity-40"
      />

      {/* Gold diagonal slash accent */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[45%] h-full opacity-[0.04]"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, var(--yif-gold) 40%, var(--yif-gold) 42%, transparent 42%)",
        }}
      />

      {/* Vertical program indicators — top right */}
      <div
        aria-hidden
        className="absolute top-10 right-10 flex flex-col gap-3 opacity-30"
      >
        {["Karo-Ojire", "Scholarship", "Awards", "Youth"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="block h-px"
              style={{
                width: `${20 + i * 10}px`,
                background: "var(--yif-gold)",
              }}
            />
            <span className="text-[var(--yif-gold)] text-[10px] font-semibold uppercase tracking-[0.2em]">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pb-16 sm:pb-20 pt-32 w-full">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-white/40 text-xs mb-8"
        >
          <a href="/" className="hover:text-white/70 transition-colors">
            Home
          </a>
          <span>/</span>
          <span className="text-white/70">Programs</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <TrustBadge variant="pill" />
            </div>
            <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
              What We Do
            </p>
            <h1
              className="font-display font-semibold text-white leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)" }}
            >
              Programs &amp;
              <br />
              <em className="text-[var(--yif-gold)] not-italic">Initiatives</em>
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-xl leading-relaxed">
              Four pillars driving Yoruba advancement — economic empowerment,
              education, cultural recognition, and youth development.
            </p>
          </div>

          {/* 4 program anchors */}
          <div className="flex flex-col gap-2 lg:text-right">
            {[
              {
                label: "Karo-Ojire Investments",
                href: "#karo-ojire",
                color: "bg-[var(--yif-gold)]",
              },
              {
                label: "Scholarship Program",
                href: "#scholarship",
                color: "bg-[var(--yif-terracotta)]",
              },
              {
                label: "Events & Awards",
                href: "#awards",
                color: "bg-[var(--yif-navy-light,#253560)]",
              },
              {
                label: "Youth Development",
                href: "#youth",
                color: "bg-[var(--yif-green)]",
              },
            ].map(({ label, href, color }) => (
              <a
                key={href}
                href={href}
                className="group flex lg:flex-row-reverse items-center gap-3 text-white/60 hover:text-white transition-colors text-sm"
              >
                <span
                  className={`block w-1.5 h-1.5 rounded-full ${color} opacity-70 group-hover:opacity-100 transition-opacity`}
                />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
