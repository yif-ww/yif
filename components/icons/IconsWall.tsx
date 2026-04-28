"use client";

import { useRef } from "react";
import Link from "next/link";
import { YORUBA_ICONS } from "@/lib/yoruba-icons";
import { IconCard } from "@/components/icons/IconCard";

/**
 * Homepage "Yoruba Icons — Wall of Influence".
 * Horizontally-scrolling carousel on small screens, snap grid on large.
 */
export function IconsWall() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-icon-slide]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <section
      id="wall-of-influence"
      className="relative overflow-hidden bg-yif-navy py-24 sm:py-32"
    >
      {/* Cultural background wash */}
      <div
        className="absolute inset-0 opacity-[0.08] pattern-adinkra"
        aria-hidden
      />
      <div
        className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-yif-gold/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        {/* Header */}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-yif-gold-light">
              Wall of Influence
            </p>
            <h2 className="font-display text-4xl font-semibold leading-tight text-yif-cream sm:text-5xl">
              The Yoruba icons whose
              <span className="block text-yif-gold-light">
                shoulders we stand on.
              </span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-yif-cream/75">
              From Awolowo&rsquo;s free education to the Ooni&rsquo;s digital
              diaspora — eight figures whose courage, scholarship and
              stewardship shape every YIF programme today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <CarouselButton dir="left" onClick={() => scrollBy(-1)} />
            <CarouselButton dir="right" onClick={() => scrollBy(1)} />
            <Link
              href="/about#yoruba-icons"
              className="ml-2 hidden text-xs font-semibold uppercase tracking-[0.2em] text-yif-gold-light hover:text-yif-gold sm:inline-flex"
            >
              View timeline →
            </Link>
          </div>
        </div>

        {/* Scroller */}
        <div
          ref={scrollerRef}
          className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-10 sm:px-10 lg:-mx-14 lg:px-14"
        >
          {YORUBA_ICONS.map((icon, idx) => (
            <div
              key={icon.id}
              data-icon-slide
              className="snap-start shrink-0 basis-[78%] sm:basis-[44%] lg:basis-[30%] xl:basis-[24%]"
            >
              <IconCard icon={icon} size="lg" delayMs={idx * 80} />
            </div>
          ))}
        </div>

        {/* Mobile timeline link */}
        <div className="mt-8 sm:hidden">
          <Link
            href="/about#yoruba-icons"
            className="inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-yif-gold-light hover:text-yif-gold"
          >
            View full timeline →
          </Link>
        </div>
      </div>
    </section>
  );
}

function CarouselButton({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Scroll left" : "Scroll right"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-yif-gold/40 text-yif-gold-light transition-colors hover:border-yif-gold-light hover:bg-yif-gold/15"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
        className={dir === "left" ? "rotate-180" : ""}
      >
        <path
          d="M2 7h10M8 3l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
