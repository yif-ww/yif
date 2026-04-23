const DIASPORA_REPS = [
  { name: "Mr Ayobami Prosper Micheal", country: "Mali", continent: "Africa" },
  { name: "Dr. Gbenga Adeyeye", country: "South Africa", continent: "Africa" },
  { name: "Alhaji Abiola Olumola", country: "Uganda", continent: "Africa" },
  {
    name: "Princess Bolajoko Oyeronke",
    country: "South West, Nigeria",
    continent: "Africa",
  },
  { name: "Mr Adeyemi Adetula", country: "Diaspora", continent: "Global" },
  { name: "Mr Bamidele Akindola", country: "Brazil", continent: "Americas" },
  {
    name: "Ms. Olushola Olude",
    country: "United States",
    continent: "Americas",
  },
  {
    name: "Mrs Oladipo Foluke",
    country: "United States",
    continent: "Americas",
  },
  { name: "Prince Akintunde Awoyera", country: "China", continent: "Asia" },
  {
    name: "Princess Omolabake Margret King",
    country: "London, UK",
    continent: "Europe",
  },
  {
    name: "Princess Ogundowole Oluwaseyi",
    country: "France",
    continent: "Europe",
  },
  {
    name: "Dr Ogundowole Bolu Johnson",
    country: "Advisory Committee",
    continent: "Global",
  },
];

const CONTINENT_COLORS: Record<string, string> = {
  Africa:
    "bg-[var(--yif-terracotta)]/15 text-[var(--yif-terracotta)] border-[var(--yif-terracotta)]/20",
  Americas:
    "bg-[var(--yif-green)]/15 text-[var(--yif-green)] border-[var(--yif-green)]/20",
  Europe:
    "bg-[var(--yif-gold)]/15 text-[var(--yif-gold)] border-[var(--yif-gold)]/20",
  Asia: "bg-blue-900/20 text-blue-300 border-blue-500/20",
  Global: "bg-white/10 text-white/70 border-white/15",
};

const AFFILIATES = [
  "Yoruba Council of Elders",
  "Oodua Peoples Congress",
  "Yoruba Parapo",
  "Egbe Omo Yoruba U.S.A",
  "Yoruba Descendants Brazil",
  "YIF Dublin, Ireland",
  "YIF Austria Chapter",
  "YIF USA Chapter",
  "Ibadan Progressive U.S.A",
  "The Black Heritage",
  "Oodua Dynasty",
  "Ekimogun Associations",
  "Ikale Progressive U.S.A",
  "YIF U.K./Europe Chapters",
  "Efon Alaye Progressive U.S.A",
  "Yoruba Unity Forum",
  "Egbe Omo Yoruba Toronto, Canada",
  "Yoruba Community Association Toronto",
  "Ifa Orisa Iyemoja Brazil",
  "Oodua Group",
  "Egbe Isokan Yoruba London",
  "YIF Lisbon, Portugal",
];

export function DiasporaSection() {
  const continents = ["Africa", "Americas", "Europe", "Asia", "Global"];

  return (
    <>
      {/* ── Diaspora Network ── */}
      <section className="bg-[var(--yif-navy)] py-24 sm:py-32 overflow-hidden relative">
        <div
          aria-hidden
          className="absolute inset-0 pattern-adinkra opacity-40"
        />

        {/* Decorative rings */}
        <svg
          aria-hidden
          className="absolute -bottom-32 -left-32 w-[420px] h-[420px] opacity-[0.06]"
          viewBox="0 0 420 420"
          fill="none"
        >
          {[50, 100, 150, 200].map((r) => (
            <circle
              key={r}
              cx="210"
              cy="210"
              r={r}
              stroke="#c9913d"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
          {/* Header */}
          <div className="mb-14 sm:mb-16">
            <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
              Global Presence
            </p>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white leading-tight max-w-xl">
                Our Diaspora Representatives
              </h2>
              <p className="text-white/50 text-sm max-w-xs leading-relaxed">
                YIF representatives spanning five continents, united by heritage
                and purpose.
              </p>
            </div>
            <div className="h-0.5 w-16 bg-[var(--yif-gold)] mt-6" />
          </div>

          {/* Continent groupings */}
          <div className="space-y-10">
            {continents.map((continent) => {
              const reps = DIASPORA_REPS.filter(
                (r) => r.continent === continent,
              );
              if (reps.length === 0) return null;
              return (
                <div key={continent}>
                  <p className="text-white/30 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
                    {continent}
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {reps.map(({ name, country }) => {
                      const colorClass = CONTINENT_COLORS[continent];
                      return (
                        <div
                          key={name}
                          className="flex items-start gap-3 bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3.5 transition-colors duration-200"
                        >
                          <span
                            className={`flex-none mt-0.5 text-xs font-semibold px-2 py-0.5 rounded border ${colorClass}`}
                          >
                            {country}
                          </span>
                          <span className="text-white/80 text-sm leading-snug">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* UN/ECOSOC certification block */}
          <div className="mt-16 sm:mt-20 border border-[var(--yif-gold)]/25 rounded-3xl p-8 sm:p-10 bg-[var(--yif-gold)]/5 flex flex-col sm:flex-row sm:items-center gap-8">
            {/* UN badge emblem */}
            <div className="flex-none">
              <div className="w-20 h-20 rounded-full bg-[var(--yif-gold)]/10 border-2 border-[var(--yif-gold)]/30 flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="#c9913d"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="12"
                    stroke="#c9913d"
                    strokeWidth="1"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="6"
                    stroke="#c9913d"
                    strokeWidth="1"
                  />
                  {/* horizontal/vertical grid lines */}
                  <line
                    x1="2"
                    y1="20"
                    x2="38"
                    y2="20"
                    stroke="#c9913d"
                    strokeWidth="0.75"
                  />
                  <line
                    x1="20"
                    y1="2"
                    x2="20"
                    y2="38"
                    stroke="#c9913d"
                    strokeWidth="0.75"
                  />
                  <path
                    d="M 5 10 Q 20 2 35 10"
                    stroke="#c9913d"
                    strokeWidth="0.75"
                    fill="none"
                  />
                  <path
                    d="M 5 30 Q 20 38 35 30"
                    stroke="#c9913d"
                    strokeWidth="0.75"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-widest mb-2">
                United Nations Recognition
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-2">
                UN/ECOSOC Special Consultative Status
              </h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-lg">
                Granted by the United Nations Economic and Social Council in
                2019. YIF holds Special Consultative Status as a recognised
                international non-governmental organisation. Registration No.{" "}
                <span className="text-[var(--yif-gold)] font-semibold">
                  IT 28744
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Affiliated Organisations ── */}
      <section className="bg-[var(--yif-cream)] py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
          <div className="mb-12">
            <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
              Our Network
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--yif-navy)] mb-3 leading-tight">
              Affiliated Organisations
            </h2>
            <div className="h-0.5 w-12 bg-[var(--yif-gold)]" />
          </div>

          <div className="flex flex-wrap gap-2.5">
            {AFFILIATES.map((org) => (
              <span
                key={org}
                className="text-sm text-[var(--yif-charcoal)] bg-white border border-[var(--yif-cream-dark)] px-4 py-2.5 rounded-full hover:border-[var(--yif-gold)]/40 hover:bg-[var(--yif-cream)] transition-colors"
              >
                {org}
              </span>
            ))}
          </div>

          {/* Governance CTA */}
          <div className="mt-14 flex flex-col sm:flex-row sm:items-center gap-5 p-7 sm:p-8 bg-white rounded-2xl border border-[var(--yif-cream-dark)]">
            <div className="flex-1">
              <p className="font-display text-xl sm:text-2xl font-semibold text-[var(--yif-navy)] mb-1">
                Governance &amp; Documentation
              </p>
              <p className="text-[var(--yif-charcoal)]/60 text-sm">
                Access our constitution, annual reports, and organisational
                policies.
              </p>
            </div>
            <a
              href="#"
              className="flex-none inline-flex items-center gap-2 bg-[var(--yif-navy)] text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-[var(--yif-navy-light)] transition-colors"
            >
              View Documents
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
