export function AwardsSection() {
  return (
    <section id="awards" className="bg-white relative overflow-hidden">
      {/* Subtle navy corner block */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 w-48 h-48 opacity-[0.03]"
        style={{ background: "var(--yif-navy)" }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-24 sm:py-32">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-12">
          <span className="block w-10 h-px bg-[var(--yif-navy)]" />
          <span className="text-[var(--yif-navy)] text-xs font-semibold uppercase tracking-[0.25em]">
            Program 03
          </span>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">
          {/* Left: 2/5 — text */}
          <div className="lg:col-span-2">
            <h2
              className="font-display font-semibold text-[var(--yif-navy)] mb-4 leading-tight"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
            >
              Events &amp;
              <br />
              <span className="text-[var(--yif-gold)]">Awards Ceremony</span>
            </h2>
            <p className="text-[var(--yif-charcoal)]/70 text-sm leading-relaxed mb-6">
              Once a year, an illustrious son or daughter of the Yoruba nation
              is honoured with an award and a staff of distinction in the{" "}
              <strong>Order of Odua</strong> — celebrating great and selfless
              Yoruba leaders who fought vigorously for Yoruba emancipation.
            </p>
            <p className="text-[var(--yif-charcoal)]/60 text-sm leading-relaxed mb-8">
              The awards program celebrates Yoruba leaders and community members
              who have made significant contributions to the advancement of the
              Yoruba people at home and in the diaspora.
            </p>
            <a
              href="/events"
              className="inline-flex items-center gap-2 bg-[var(--yif-navy)] text-white text-sm font-semibold px-6 py-3 rounded hover:bg-[var(--yif-navy-dark,#111b33)] transition-colors"
            >
              View Upcoming Events
              <span aria-hidden>→</span>
            </a>
          </div>

          {/* Right: 3/5 — highlights */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: "🏆",
                title: "Order of Odua",
                desc: "The highest recognition bestowed on exemplary sons and daughters of the Yoruba race.",
                color: "bg-[var(--yif-gold)]/10 border-[var(--yif-gold)]/20",
              },
              {
                icon: "🎖",
                title: "Staff of Distinction",
                desc: "A symbolic staff presented to recipients representing leadership and cultural heritage.",
                color: "bg-[var(--yif-navy)]/5 border-[var(--yif-navy)]/10",
              },
              {
                icon: "🌍",
                title: "Annual Ceremony",
                desc: "A grand annual event uniting Yoruba leaders, members, and diaspora from across the world.",
                color: "bg-[var(--yif-green)]/8 border-[var(--yif-green)]/15",
              },
              {
                icon: "📅",
                title: "Cultural Events",
                desc: "Workshops, conferences, and cultural gatherings throughout the year.",
                color:
                  "bg-[var(--yif-terracotta)]/8 border-[var(--yif-terracotta)]/15",
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`rounded-xl border p-5 ${card.color} animate-fade-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-2xl mb-3">{card.icon}</div>
                <h3 className="font-semibold text-[var(--yif-navy)] text-sm mb-2">
                  {card.title}
                </h3>
                <p className="text-[var(--yif-charcoal)]/60 text-xs leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function YouthSection() {
  return (
    <section
      id="youth"
      className="bg-[var(--yif-green)] relative overflow-hidden"
    >
      {/* Geometric texture */}
      <div
        aria-hidden
        className="absolute inset-0 pattern-adinkra opacity-[0.12]"
      />

      {/* Decorative circle */}
      <div
        aria-hidden
        className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full opacity-[0.08]"
        style={{ background: "white" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-24 sm:py-32">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-12">
          <span className="block w-10 h-px bg-white/40" />
          <span className="text-white/60 text-xs font-semibold uppercase tracking-[0.25em]">
            Program 04
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-14 items-start">
          {/* Left */}
          <div>
            <h2
              className="font-display font-semibold text-white mb-4 leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Youth Development
              <br />
              <span className="text-white/60">&amp; Empowerment</span>
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              Youth development and empowerment initiatives targeting young
              Yorubas in the diaspora and homeland — building the next
              generation of Yoruba leaders, innovators, and cultural
              ambassadors.
            </p>

            {/* Leadership cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                { name: "Ogundare Adenike", role: "Youth Coordinator" },
                {
                  name: "Mr. Oluwatosin Famori",
                  role: "Director IT & Youth Affairs",
                },
              ].map((person) => {
                const initials = person.name
                  .split(" ")
                  .filter(
                    (w) =>
                      !/^(mr|mrs|dr|prof|chief|hon|oba|prince|princess)\.?$/i.test(
                        w,
                      ),
                  )
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={person.name}
                    className="bg-white/10 rounded-xl p-4 border border-white/20 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">
                        {person.name}
                      </p>
                      <p className="text-white/55 text-xs mt-0.5">
                        {person.role}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href="/programs/youth"
              className="inline-flex items-center gap-2 bg-white text-[var(--yif-green)] text-sm font-semibold px-6 py-3 rounded hover:bg-white/90 transition-colors"
            >
              Join Youth Program
              <span aria-hidden>→</span>
            </a>
          </div>

          {/* Right: program pillars */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-6">
              Program Focus Areas
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Leadership Development",
                  desc: "Training workshops and mentorship for emerging Yoruba leaders.",
                },
                {
                  label: "Cultural Heritage",
                  desc: "Immersive programs teaching Yoruba language, history, and traditions.",
                },
                {
                  label: "Economic Empowerment",
                  desc: "Skills training and entrepreneurship support for young members.",
                },
                {
                  label: "Diaspora Connection",
                  desc: "Bridging young Yorubas at home and abroad through digital platforms.",
                },
                {
                  label: "Scholarship Pathways",
                  desc: "Guiding eligible youth through the YIF scholarship application process.",
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 p-4 bg-white/[0.07] rounded-lg border border-white/10 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      {item.label}
                    </p>
                    <p className="text-white/50 text-xs mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
