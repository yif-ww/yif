import Link from "next/link";

export function CtaBanner() {
  return (
    <section className="relative bg-[var(--yif-navy-dark)] py-20 sm:py-28 overflow-hidden">
      {/* Decorative concentric circles — left */}
      <div
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full border border-[var(--yif-gold)]/8 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-[340px] h-[340px] rounded-full border border-[var(--yif-gold)]/10 pointer-events-none"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-10 text-center">
        <p className="text-[var(--yif-gold)]/60 text-xs font-semibold uppercase tracking-[0.25em] mb-4">
          Be Part of Something Bigger
        </p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6">
          Your Heritage. Your Community.
          <br />
          <em className="not-italic text-[var(--yif-gold)]">
            Your Foundation.
          </em>
        </h2>
        <p className="text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Whether you are in Lagos, London, Lisbon, or anywhere across the globe
          — YIF is your home. Join thousands of Yoruba people united in
          progress, pride, and purpose.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/membership"
            className="inline-flex items-center rounded-full bg-[var(--yif-gold)] px-9 py-4 text-[var(--yif-navy)] text-sm font-semibold uppercase tracking-widest hover:bg-[var(--yif-gold-light)] transition-colors duration-200"
          >
            Become a Member
          </Link>
          <Link
            href="/donate"
            className="inline-flex items-center rounded-full border border-white/20 px-9 py-4 text-white/80 text-sm font-semibold uppercase tracking-widest hover:border-white/50 hover:text-white transition-colors duration-200"
          >
            Make a Donation
          </Link>
        </div>
      </div>
    </section>
  );
}
