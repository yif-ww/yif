const VALUES = [
  {
    label: "Unity",
    icon: "◎",
    description:
      "Yoruba people coming together regardless of location or wealth",
  },
  {
    label: "Empowerment",
    icon: "⬆",
    description: "Economic and social advancement for all Yoruba people",
  },
  {
    label: "Cultural Pride",
    icon: "✦",
    description:
      "Preservation and celebration of Yoruba heritage and tradition",
  },
  {
    label: "Transparency",
    icon: "◇",
    description: "Open governance and accountability at every level",
  },
  {
    label: "Self-Reliance",
    icon: "◈",
    description: "Community-driven solutions, independent of government aid",
  },
  {
    label: "Global Reach",
    icon: "◉",
    description: "Connecting Yoruba people worldwide into one united network",
  },
];

const OBJECTIVES = [
  "Create mechanisms for non-partisan cooperation among Yorubas at communal, local, and international levels.",
  "Plan and actualize cooperation among Yorubas through research, investigation, and policy formulation promoting economic progress, social harmony, and general well-being.",
  "Initiate consultation and cooperation with Yoruba-friendly individuals, NGOs, and international bodies — linking them with relevant Yoruba state authorities.",
  "Preserve Yoruba culture through formal teaching and learning processes in high schools, colleges, and educational institutions abroad.",
  "Enable sons and daughters of the Yoruba race to break free from poverty through cooperative economic initiatives and entrepreneurship.",
];

export function MissionVisionSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
        {/* Section header */}
        <div className="mb-16 sm:mb-20 max-w-2xl">
          <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            Who We Are
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold text-[var(--yif-navy)] mb-6 leading-tight">
            Mission &amp; Vision
          </h2>
          <div className="h-0.5 w-16 bg-[var(--yif-gold)]" />
        </div>

        {/* Two-column layout: mission + objectives */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 mb-20 sm:mb-24">
          {/* Left — Mission statement */}
          <div>
            <div className="border-l-4 border-[var(--yif-gold)] pl-7 mb-8">
              <p className="font-display italic text-2xl sm:text-3xl text-[var(--yif-navy)] leading-snug font-medium">
                "Our mission is to genuinely and sincerely reach out to
                corporate entities, traditional rulers, leaders, organizations,
                and sons and daughters of the Yoruba race for progress and
                unity."
              </p>
            </div>

            <p className="text-[var(--yif-charcoal)] leading-relaxed text-base sm:text-lg mb-6">
              The Yoruba Indigenes&apos; Foundation (YIF) is a global
              non-governmental organization uniting Yoruba people across the
              world. With UN/ECOSOC Special Consultative Status granted in 2019,
              YIF operates at the intersection of culture, governance, and
              community development.
            </p>
            <p className="text-[var(--yif-charcoal)] leading-relaxed text-base sm:text-lg">
              Our reach-out endeavour continuously updates knowledge toward
              conscious and unparalleled ideas for strengthening the cultural
              entities of Yoruba values — mostly through formal teaching and
              learning processes in high schools, colleges, and institutions
              abroad.
            </p>
          </div>

          {/* Right — Vision objectives */}
          <div>
            <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-6">
              Our Objectives
            </p>
            <ol className="space-y-5">
              {OBJECTIVES.map((obj, i) => (
                <li key={i} className="flex gap-4">
                  <span
                    className="flex-none font-display text-3xl font-semibold leading-none mt-0.5"
                    style={{ color: "var(--yif-gold)", opacity: 0.35 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[var(--yif-charcoal)] leading-relaxed text-sm sm:text-base">
                    {obj}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Values grid */}
        <div className="border-t border-[var(--yif-cream-dark)] pt-16 sm:pt-20">
          <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-10 text-center">
            Our Core Values
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {VALUES.map(({ label, icon, description }) => (
              <div
                key={label}
                className="group flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-[var(--yif-cream)] hover:bg-[var(--yif-navy)] transition-colors duration-300"
              >
                <span
                  className="text-2xl text-[var(--yif-gold)] group-hover:text-[var(--yif-gold-light)] transition-colors"
                  aria-hidden
                >
                  {icon}
                </span>
                <span className="font-display text-lg font-semibold text-[var(--yif-navy)] group-hover:text-white transition-colors">
                  {label}
                </span>
                <p className="text-xs text-[var(--yif-charcoal)]/70 group-hover:text-white/60 transition-colors leading-relaxed hidden sm:block">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
