const TIERS = [
  {
    name: "Silver",
    amount: "N5,000",
    icon: "◈",
    accent: "border-white/20 text-white/80",
  },
  {
    name: "Gold",
    amount: "N10,000",
    icon: "◉",
    accent: "border-[var(--yif-gold)]/60 text-[var(--yif-gold)]",
  },
  {
    name: "Diamond",
    amount: "N15,000",
    icon: "✦",
    accent: "border-[var(--yif-gold)] text-[var(--yif-gold)]",
  },
  {
    name: "Platinum",
    amount: "N20,000",
    icon: "❋",
    accent: "border-[var(--yif-gold)] text-[var(--yif-gold)]",
  },
] as const;

const FINANCE_SOURCES = [
  "Member registration with annual stipend funds of N2,500 · $10 · £10 per head",
  "Donations from well-meaning YIF members at home and in the diaspora",
  "Workshops, seminars, and recognition events",
  "Yoruba cultural heritage recognition events",
];

export function KaroOjireSection() {
  return (
    <section
      id="karo-ojire"
      className="bg-[var(--yif-navy)] relative overflow-hidden"
    >
      {/* Subtle pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pattern-adinkra opacity-20"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-24 sm:py-32">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-12">
          <span className="block w-10 h-px bg-[var(--yif-gold)]" />
          <span className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em]">
            Program 01
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: title + description */}
          <div>
            <h2
              className="font-display font-semibold text-white mb-6 leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Karo-Ojire
              <br />
              <span className="text-[var(--yif-gold)]">Investments Ltd.</span>
            </h2>

            <p className="text-white/50 text-xs uppercase tracking-widest mb-5">
              Economic Empowerment Project
            </p>

            <p className="text-white/75 text-base leading-relaxed mb-6">
              A cooperative economy initiative designed for ownership and future
              employment of participants — enabling sons and daughters of the
              Yoruba race to break free from the prevalent poverty syndrome.
            </p>

            {/* Philosophy quote */}
            <blockquote className="border-l-4 border-[var(--yif-gold)] pl-5 py-1 my-8">
              <p className="text-white/60 text-sm italic leading-relaxed">
                "We as a people can no longer continue to glorify a developed
                national paralysis that is driven by waiting for the government
                or someone else to do something for us. The beauty of
                cooperative economy is that we can simply move our race forward,
                doing what we know is best for us."
              </p>
            </blockquote>

            <p className="text-white/65 text-sm leading-relaxed mb-8">
              The project&apos;s primary objective is to stimulate a positive
              mindset through training and development of children and create
              jobs through self-employment, particularly for widows and disabled
              individuals who have been neglected in society.
            </p>

            <a
              href="/membership"
              className="inline-flex items-center gap-2 bg-[var(--yif-gold)] text-[var(--yif-navy)] text-sm font-semibold px-6 py-3 rounded hover:bg-[var(--yif-amber,#e8a93e)] transition-colors"
            >
              Join Karo-Ojire
              <span aria-hidden>→</span>
            </a>
          </div>

          {/* Right: membership tiers + finance sources */}
          <div className="flex flex-col gap-8">
            {/* Tiers */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-5">
                Membership Tiers
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TIERS.map((tier, i) => (
                  <div
                    key={tier.name}
                    className={`border rounded-lg p-4 ${tier.accent} animate-fade-up`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-lg">{tier.icon}</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-60">
                        {tier.name}
                      </span>
                    </div>
                    <p className="font-display text-2xl font-semibold">
                      {tier.amount}
                    </p>
                    <p className="text-xs opacity-50 mt-0.5">
                      annual contribution
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources of finance */}
            <div className="bg-white/[0.04] rounded-xl p-6 border border-white/10">
              <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-5">
                Sources of Finance
              </p>
              <ul className="flex flex-col gap-3">
                {FINANCE_SOURCES.map((source, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-white/60 text-sm leading-relaxed"
                  >
                    <span className="mt-1.5 block w-1 h-1 rounded-full bg-[var(--yif-gold)] flex-shrink-0" />
                    {source}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
