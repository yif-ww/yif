type Leader = { name: string; role: string };

const NATIONAL_LEADERSHIP: Leader[] = [
  { name: "Chief Abiodun Fajobi", role: "Chairman, Board of Trustees" },
  { name: "Prof Oluyemisi Akinyemiju", role: "Chairman, Advisory Board" },
  {
    name: "Prince Tajudeen Olusi (MON, OON)",
    role: "Life Patron YIF Worldwide",
  },
  { name: "Dr. Aderibole Olumide", role: "National President / CEO" },
  { name: "Chief Aderounmu Adesesan", role: "National Coordinator" },
  { name: "Chief Mrs Oseyemi Awosika", role: "Vice President (Co-founder)" },
  { name: "Mr. Omosehin Lawson", role: "National Secretary / CEO" },
  { name: "Mrs. Funmilola Osifowora", role: "Director of Welfare" },
  { name: "Ogundare Adenike", role: "Youth Coordinator" },
  { name: "Mrs. Kikelomo Fareo", role: "Director of Women Affairs" },
  {
    name: "Comrade Akintoye Olaoluwa",
    role: "Director of Admin & Mobilization",
  },
  { name: "Dr. Adetokunbo Adedeji", role: "Chairman, Organizing Committee" },
  { name: "Mr. Mokelu Bayo", role: "Director of Protocol" },
  { name: "Mr. Sanjo Olawuyi", role: "Director of Publicity" },
  { name: "Chief Adebayo Odeyemi", role: "Public Relations Officer" },
  { name: "Mr. Olufemi E.A Ogoigbe", role: "Director, Project & Coordination" },
  { name: "Otunba (Barr) Olu Adenodi", role: "Legal Adviser" },
  { name: "Mr. Oluwatosin Famori", role: "Director, IT & Youth Affairs" },
];

const UK_TEAM: Leader[] = [
  {
    name: "Princess M. Adewunmi King (Labamba)",
    role: "National Co-ordinator, UK",
  },
  {
    name: "Hon. Adeoye Ayinde Obanleowo",
    role: "Director of Communications & PR",
  },
  { name: "Adeyinka Alabi", role: "Financial Secretary" },
  { name: "Joy Olufunmilayo Coker", role: "Director of Mobilisation" },
  { name: "Abiola A. Makinde (ABM)", role: "Director of Women Affairs" },
  { name: "Aderemi Amokeokin Spencer", role: "Public Relations Officer" },
  { name: "Mr. Edward Kayode Adeleye", role: "Treasurer" },
  { name: "Amos Ogunyemi", role: "Secretary" },
  { name: "Jennifer Adesanya", role: "Asst. Director of Mobilisation" },
];

const GRAND_PATRONS = [
  {
    name: "HM Oba Adeyeye Enitan Ogunwusi, Ojaja II",
    title: "Ooni of Ile-Ife (Current)",
    note: "Grand Patron",
  },
  {
    name: "HIM Oba Lamidi Olayiwola Adeyemi",
    title: "Alaafin of Oyo",
    note: "Grand Patron",
  },
  {
    name: "HIM Oba Alayeluwa Okunade Sijuwade Olubuse II",
    title: "Former Ooni of Ife",
    note: "Grand Patron (Late)",
  },
];

const NOTABLE_PATRONS = [
  "Asiwaju Michael Ade Ojo",
  "Chief (Mrs) Mobolaji Osomo",
  "Chief Jimoh Ibrahim",
  "Wale Babalakin",
  "Chief Michael Adeojo (Elizade Motors)",
  "Erelu Dosunmu Abiola",
  "Chief Ayoade Oshinlade",
  "Chief John Odeyemi",
  "Oba Michael Akinruntan",
  "Oba Adekunle Makama",
  "Olowu Kuta",
];

/** Extract two-letter initials from a name for avatar display */
function initials(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/);
  const meaningful = words.filter(
    (w) =>
      ![
        "mr.",
        "mrs.",
        "dr.",
        "chief",
        "hon.",
        "prince",
        "princess",
        "late",
        "prof",
        "otunba",
        "barr",
        "alhaji",
        "ms.",
        "mr",
        "mrs",
        "dr",
        "comrade",
      ].includes(w.toLowerCase()),
  );
  if (meaningful.length >= 2) {
    return (meaningful[0][0] + meaningful[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/** Avatar background hue rotated per name for variety */
const AVATAR_COLORS = [
  "bg-[var(--yif-navy)] text-[var(--yif-gold)]",
  "bg-[var(--yif-gold)]/20 text-[var(--yif-navy)]",
  "bg-[var(--yif-terracotta)]/15 text-[var(--yif-terracotta)]",
  "bg-[var(--yif-green)]/15 text-[var(--yif-green)]",
];

function LeaderCard({ leader, index }: { leader: Leader; index: number }) {
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className="group flex flex-col bg-[var(--yif-cream)] hover:bg-white border border-[var(--yif-cream-dark)] hover:border-[var(--yif-gold)]/30 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg">
      {/* Avatar */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-semibold text-base mb-4 ${colorClass}`}
      >
        {initials(leader.name)}
      </div>
      {/* Name */}
      <p className="font-display text-lg font-semibold text-[var(--yif-navy)] leading-snug mb-1.5">
        {leader.name}
      </p>
      {/* Role */}
      <p className="text-xs text-[var(--yif-charcoal)]/60 uppercase tracking-wider leading-relaxed">
        {leader.role}
      </p>
    </div>
  );
}

export function LeadershipSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14">
        {/* ── National Leadership ── */}
        <div className="mb-20 sm:mb-24">
          <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            National Executive
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-3">
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-[var(--yif-navy)] leading-tight">
              Our Leadership
            </h2>
            <p className="text-[var(--yif-charcoal)]/60 text-sm max-w-xs leading-relaxed">
              Dedicated individuals steering YIF&apos;s mission across
              continents.
            </p>
          </div>
          <div className="h-0.5 w-16 bg-[var(--yif-gold)] mb-12" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {NATIONAL_LEADERSHIP.map((leader, i) => (
              <LeaderCard key={leader.name} leader={leader} index={i} />
            ))}
          </div>
        </div>

        {/* ── UK Chapter ── */}
        <div className="mb-20 sm:mb-24">
          <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            United Kingdom
          </p>
          <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--yif-navy)] mb-3 leading-tight">
            UK Executive Team
          </h3>
          <div className="h-0.5 w-12 bg-[var(--yif-gold)] mb-10" />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {UK_TEAM.map((leader, i) => (
              <LeaderCard key={leader.name} leader={leader} index={i + 2} />
            ))}
          </div>
        </div>

        {/* ── Grand Patrons ── */}
        <div>
          <p className="text-[var(--yif-gold)] text-xs font-semibold uppercase tracking-[0.25em] mb-4">
            Royal Endorsement
          </p>
          <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--yif-navy)] mb-3 leading-tight">
            Grand Patrons &amp; Notable Supporters
          </h3>
          <div className="h-0.5 w-12 bg-[var(--yif-gold)] mb-10" />

          {/* Grand Patron cards */}
          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {GRAND_PATRONS.map(({ name, title, note }) => (
              <div
                key={name}
                className="relative bg-[var(--yif-navy)] rounded-2xl p-6 overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 pattern-adinkra opacity-25"
                />
                <div className="relative z-10">
                  <span className="inline-block bg-[var(--yif-gold)]/20 text-[var(--yif-gold)] text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full mb-4">
                    {note}
                  </span>
                  <p className="font-display text-xl font-semibold text-white leading-snug mb-1">
                    {name}
                  </p>
                  <p className="text-white/50 text-xs">{title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notable patrons pill list */}
          <div className="flex flex-wrap gap-2.5">
            {NOTABLE_PATRONS.map((patron) => (
              <span
                key={patron}
                className="text-sm text-[var(--yif-charcoal)] bg-[var(--yif-cream)] border border-[var(--yif-cream-dark)] px-4 py-2 rounded-full"
              >
                {patron}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
