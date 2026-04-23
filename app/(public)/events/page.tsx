import type { Metadata } from "next";
import Link from "next/link";
import {
  EVENTS,
  PAST_EVENTS,
  CATEGORY_COLORS,
  CATEGORY_GRADIENTS,
  formatEventDate,
  formatCurrency,
} from "@/lib/events-data";

export const metadata: Metadata = {
  title: "Events & Conferences | YIF",
  description:
    "Browse upcoming YIF events, award ceremonies, conferences, and cultural gatherings around the world. Buy tickets securely via Paystack.",
};

export default function EventsPage() {
  return (
    <>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-[var(--yif-navy)] py-28 sm:py-36">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="ev-pattern"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="10"
                y="10"
                width="20"
                height="20"
                fill="none"
                stroke="white"
                strokeWidth="0.8"
              />
              <rect
                x="50"
                y="50"
                width="20"
                height="20"
                fill="none"
                stroke="white"
                strokeWidth="0.8"
              />
              <circle
                cx="40"
                cy="40"
                r="16"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ev-pattern)" />
        </svg>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--yif-gold)]">
            Calendar & Ticketing
          </p>
          <h1 className="font-display text-5xl font-semibold text-white sm:text-6xl">
            Events &amp; Conferences
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            Join the global Yoruba community at award ceremonies, summits,
            workshops, and cultural celebrations. Secure your place — tickets
            sold via Paystack.
          </p>
        </div>
      </div>

      {/* ── Upcoming events ── */}
      <section className="bg-[var(--yif-cream)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--yif-gold)]">
            Upcoming
          </p>
          <h2 className="mb-12 font-display text-4xl font-semibold text-[var(--yif-navy)] sm:text-5xl">
            Events This Year
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-2">
            {EVENTS.map((event, index) => {
              const minPrice = Math.min(...event.tiers.map((t) => t.price));
              return (
                <article
                  key={event.slug}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--yif-cream-dark)] bg-white shadow-sm transition-shadow hover:shadow-lg animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Colour band */}
                  <div
                    className={`relative h-36 bg-gradient-to-br ${CATEGORY_GRADIENTS[event.category]} flex items-end p-6`}
                  >
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full opacity-10"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id={`card-${event.slug}`}
                          x="0"
                          y="0"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <circle
                            cx="20"
                            cy="20"
                            r="8"
                            fill="none"
                            stroke="white"
                            strokeWidth="0.8"
                          />
                        </pattern>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill={`url(#card-${event.slug})`}
                      />
                    </svg>
                    <span className="relative z-10 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                      {event.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-1 font-display text-xl font-semibold leading-snug text-[var(--yif-navy)] group-hover:text-[var(--yif-gold)] transition-colors">
                      {event.title}
                    </h3>
                    <p className="mb-4 text-sm italic text-[var(--muted)]">
                      {event.tagline}
                    </p>

                    <div className="mb-4 flex flex-col gap-1.5 text-sm text-[var(--yif-charcoal)]">
                      <span className="flex items-center gap-2">
                        <svg
                          aria-hidden="true"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <rect
                            x="1"
                            y="2"
                            width="12"
                            height="11"
                            rx="1.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                          <path
                            d="M1 6h12M5 1v2M9 1v2"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <time dateTime={event.date}>
                          {formatEventDate(event.date, event.endDate)} ·{" "}
                          {event.time}
                        </time>
                      </span>
                      <span className="flex items-center gap-2">
                        <svg
                          aria-hidden="true"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                          <circle
                            cx="7"
                            cy="5"
                            r="1.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />
                        </svg>
                        {event.location} · {event.country}
                      </span>
                    </div>

                    <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
                      {event.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--yif-navy)]">
                        From {formatCurrency(minPrice)}
                      </span>
                      <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--yif-gold)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--yif-gold-light)]"
                      >
                        Buy Tickets
                        <svg
                          aria-hidden="true"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M1 7h12M8 3l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Past events ── */}
      <section className="border-t border-[var(--yif-cream-dark)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--muted)]">
            Archive
          </p>
          <h2 className="mb-8 font-display text-3xl font-semibold text-[var(--yif-navy)] sm:text-4xl">
            Past Events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PAST_EVENTS.map((event) => (
              <div
                key={event.slug}
                className="rounded-xl border border-[var(--yif-cream-dark)] bg-[var(--yif-cream)] p-5"
              >
                <span
                  className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[event.category] }}
                >
                  {event.category}
                </span>
                <h3 className="font-display text-lg font-semibold text-[var(--yif-navy)]">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {formatEventDate(event.date)} · {event.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
