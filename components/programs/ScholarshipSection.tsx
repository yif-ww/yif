const ELIGIBILITY = [
  "Must be of Yoruba heritage",
  "Demonstrated academic merit",
  "Evidence of financial need",
  "Enrolled or accepted at an accredited institution",
  "Registration fee: N5,000 (non-refundable)",
];

const STEPS = [
  {
    step: "01",
    title: "Register",
    desc: "Create your applicant profile and pay the N5,000 registration fee.",
  },
  {
    step: "02",
    title: "Apply",
    desc: "Complete the multi-step application form including academic history and essays.",
  },
  {
    step: "03",
    title: "Review",
    desc: "The scholarship committee reviews all applications for eligibility and merit.",
  },
  {
    step: "04",
    title: "Award",
    desc: "Selected scholars are notified and scholarships disbursed to their institutions.",
  },
];

export function ScholarshipSection() {
  return (
    <section
      id="scholarship"
      className="bg-[var(--yif-cream)] relative overflow-hidden"
    >
      {/* Decorative terracotta geometric element */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.07]"
        style={{
          background: "var(--yif-terracotta)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-24 sm:py-32">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-12">
          <span className="block w-10 h-px bg-[var(--yif-terracotta)]" />
          <span
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--yif-terracotta)" }}
          >
            Program 02
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: info */}
          <div>
            <h2
              className="font-display font-semibold text-[var(--yif-navy)] mb-4 leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              YIF Scholarship
              <br />
              <em
                className="not-italic"
                style={{ color: "var(--yif-terracotta)" }}
              >
                2024–2025 Batch
              </em>
            </h2>

            <p className="text-[var(--yif-charcoal)]/70 text-base leading-relaxed mb-8">
              Several students who are Yoruba indigenes now stand the chance of
              winning top-slot scholarships in premium universities both home
              and abroad — with a registration fee of just N5,000.
            </p>

            {/* Eligibility */}
            <div className="bg-white rounded-xl p-6 border border-[var(--yif-cream-dark,#ede5d4)] mb-8">
              <p
                className="text-xs uppercase tracking-[0.2em] font-semibold mb-4"
                style={{ color: "var(--yif-terracotta)" }}
              >
                Eligibility Criteria
              </p>
              <ul className="flex flex-col gap-2.5">
                {ELIGIBILITY.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[var(--yif-charcoal)]/70 text-sm"
                  >
                    <span
                      className="mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: "var(--yif-terracotta)" }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 flex-wrap">
              <a
                href="/programs/scholarship/apply"
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded text-white transition-colors"
                style={{ background: "var(--yif-terracotta)" }}
              >
                Apply for Scholarship
                <span aria-hidden>→</span>
              </a>
              <a
                href="/programs/scholarship"
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded border transition-colors text-[var(--yif-navy)] hover:bg-white"
                style={{ borderColor: "var(--yif-terracotta)" }}
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Right: how it works */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] font-semibold mb-6"
              style={{ color: "var(--yif-terracotta)" }}
            >
              How It Works
            </p>
            <div className="flex flex-col gap-0">
              {STEPS.map((item, i) => (
                <div key={item.step} className="flex gap-5 group">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "var(--yif-terracotta)" }}
                    >
                      {item.step}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 w-px my-1"
                        style={{
                          background: "var(--yif-terracotta)",
                          opacity: 0.2,
                        }}
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div
                    className={`pb-8 ${i === STEPS.length - 1 ? "pb-0" : ""}`}
                  >
                    <h3 className="font-semibold text-[var(--yif-navy)] text-base mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[var(--yif-charcoal)]/65 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Fee callout */}
            <div
              className="mt-8 rounded-xl p-5 text-white"
              style={{ background: "var(--yif-navy)" }}
            >
              <p className="text-xs uppercase tracking-[0.2em] opacity-50 mb-2">
                Registration Fee
              </p>
              <p className="font-display text-4xl font-semibold text-[var(--yif-gold)]">
                N5,000
              </p>
              <p className="text-white/50 text-xs mt-1">
                One-time, non-refundable application fee
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
