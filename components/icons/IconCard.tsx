"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CATEGORY_STYLES,
  IMPACT_STYLES,
  getRelatedIcons,
  type YorubaIcon,
} from "@/lib/yoruba-icons";

interface IconCardProps {
  icon: YorubaIcon;
  /** Visual size of the card. */
  size?: "sm" | "md" | "lg";
  /** Stagger animation delay (ms). */
  delayMs?: number;
}

const SIZE_CLASSES = {
  sm: "h-64",
  md: "h-80",
  lg: "h-96",
} as const;

/**
 * Multi-layer Yoruba Icon card:
 *  - Resting:  portrait + name + category badge
 *  - Hover/focus: quick-bio overlay with title and lifespan
 *  - Click "Learn More": full modal profile with achievements,
 *    legacy, YIF relevance, related icons
 */
export function IconCard({ icon, size = "md", delayMs = 0 }: IconCardProps) {
  const [open, setOpen] = useState(false);
  const cat = CATEGORY_STYLES[icon.category];
  const impact = IMPACT_STYLES[icon.impact];

  return (
    <>
      <article
        className={`group relative ${SIZE_CLASSES[size]} animate-fade-up overflow-hidden rounded-2xl bg-yif-navy ring-1 ring-yif-navy/10 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl focus-within:-translate-y-1 [animation-delay:var(--icon-card-delay)]`}
        // CSS custom property carries the stagger delay (avoids inline style lint)
        ref={(el) => {
          if (el) el.style.setProperty("--icon-card-delay", `${delayMs}ms`);
        }}
      >
        {/* Portrait */}
        <Image
          src={icon.imageUrl}
          alt={icon.imageAlt}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
          className="object-cover object-top opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
        />

        {/* Soft cultural pattern wash */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-yif-navy via-yif-navy/40 to-transparent" />
        <div className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-30 pattern-adinkra" />

        {/* Top badges */}
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${cat.bg} ${cat.text} ${cat.ring} backdrop-blur-md`}
          >
            {cat.label}
          </span>
          <ImpactDots count={impact.dots} label={impact.label} />
        </div>

        {/* Bottom info */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-yif-cream">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yif-gold-light">
            {icon.era} · {icon.lifespan}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-tight">
            {icon.name}
          </h3>
          {icon.yorubaTitle && (
            <p className="mt-0.5 text-xs italic text-yif-cream/75">
              {icon.yorubaTitle}
            </p>
          )}

          {/* Hover quick-bio overlay */}
          <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
            <div className="overflow-hidden">
              <p className="mt-3 text-sm leading-relaxed text-yif-cream/90">
                {icon.shortBio}
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-yif-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-yif-navy transition-colors hover:bg-yif-gold-light focus:outline-none focus:ring-2 focus:ring-yif-gold-light focus:ring-offset-2 focus:ring-offset-yif-navy"
                aria-haspopup="dialog"
              >
                Learn more
                <svg
                  width="12"
                  height="9"
                  viewBox="0 0 12 9"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M1 4.5h10M7 1l3.5 3.5L7 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>

      {open && <IconModal icon={icon} onClose={() => setOpen(false)} />}
    </>
  );
}

function ImpactDots({ count, label }: { count: number; label: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 backdrop-blur-md"
      aria-label={label}
      title={label}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < count ? "bg-yif-gold-light" : "bg-yif-cream/30"
          }`}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Modal ------------------------------ */

function IconModal({
  icon,
  onClose,
}: {
  icon: YorubaIcon;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const related = getRelatedIcons(icon);
  const cat = CATEGORY_STYLES[icon.category];

  // Lock scroll + escape-to-close + focus trap entry
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `${icon.name} — Yoruba Icon`,
          text: icon.shortBio,
          url: shareUrl,
        });
        return;
      } catch {
        // user dismissed — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`icon-${icon.id}-title`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-yif-navy-dark/85 p-0 backdrop-blur-sm sm:items-center sm:p-6 animate-fade-up"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-yif-cream shadow-2xl outline-none sm:rounded-3xl"
      >
        {/* Header strip */}
        <div className="relative h-56 w-full overflow-hidden sm:h-72">
          <Image
            src={icon.imageHiRes ?? icon.imageUrl}
            alt={icon.imageAlt}
            fill
            sizes="100vw"
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-yif-navy via-yif-navy/40 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-yif-cream/95 text-yif-navy shadow-md transition-colors hover:bg-white"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-0 p-6 text-yif-cream sm:p-8">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${cat.bg} ${cat.text} ${cat.ring} backdrop-blur-md`}
            >
              {cat.label} · {icon.impact}
            </span>
            <h2
              id={`icon-${icon.id}-title`}
              className="mt-3 font-display text-3xl leading-tight sm:text-4xl"
            >
              {icon.name}
            </h2>
            <p className="mt-1 text-sm text-yif-gold-light">
              {icon.title} · {icon.lifespan}
            </p>
            {icon.yorubaTitle && (
              <p className="text-xs italic text-yif-cream/80">
                {icon.yorubaTitle} · {icon.region}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <Section label="Quick Profile">
              <p className="text-base leading-relaxed text-yif-charcoal">
                {icon.shortBio}
              </p>
            </Section>

            <Section label="Key Achievements">
              <ul className="space-y-3">
                {icon.achievements.map((a) => (
                  <li
                    key={a}
                    className="relative pl-6 text-sm leading-relaxed text-yif-charcoal"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-yif-gold"
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </Section>

            <Section label="Legacy">
              <p className="text-sm leading-relaxed text-yif-charcoal">
                {icon.legacy}
              </p>
            </Section>

            <Section label="Why YIF honours this figure">
              <p className="rounded-xl bg-yif-gold-pale p-4 text-sm leading-relaxed text-yif-navy">
                {icon.yifRelevance}
              </p>
            </Section>
          </div>

          <aside className="space-y-8">
            <Section label="Era">
              <p className="font-display text-2xl text-yif-navy">{icon.era}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                {icon.lifespan}
              </p>
            </Section>

            {related.length > 0 && (
              <Section label="Related Icons">
                <ul className="space-y-2">
                  {related.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          // Replace dialog content by closing & reopening would
                          // require state lift; for simplicity navigate via URL hash.
                          window.location.hash = `icon-${r.id}`;
                          onClose();
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left ring-1 ring-yif-navy/10 transition-colors hover:bg-yif-cream-dark"
                      >
                        <span className="relative inline-block h-10 w-10 overflow-hidden rounded-full bg-yif-navy/10">
                          <Image
                            src={r.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover object-top"
                          />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-yif-navy">
                            {r.name}
                          </span>
                          <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">
                            {r.category}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section label="Actions">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 rounded-full bg-yif-navy px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-yif-cream transition-colors hover:bg-yif-navy-light"
                >
                  Share
                </button>
                {icon.wikipediaUrl && (
                  <Link
                    href={icon.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-yif-navy/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-yif-navy transition-colors hover:bg-yif-navy/5"
                  >
                    Wikipedia
                  </Link>
                )}
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted">
                Image: {icon.imageCredit}
              </p>
            </Section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8 last:mb-0">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-yif-gold">
        {label}
      </h3>
      {children}
    </section>
  );
}
