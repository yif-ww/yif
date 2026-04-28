"use client";

import Image from "next/image";
import { useState } from "react";
import { CATEGORY_STYLES, type YorubaIcon } from "@/lib/yoruba-icons";
import { IconCard } from "@/components/icons/IconCard";

/**
 * Vertical, alternating timeline. Each entry expands an inline IconCard
 * (which itself opens the full modal on "Learn more").
 */
export function IconsTimelineClient({ icons }: { icons: YorubaIcon[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Spine */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-6 top-0 h-full w-px bg-linear-to-b from-yif-gold via-yif-navy-light to-yif-gold opacity-50 sm:left-1/2"
      />

      <ol className="relative">
        {icons.map((icon, idx) => {
          const isLeft = idx % 2 === 0;
          const isActive = activeId === icon.id;
          const cat = CATEGORY_STYLES[icon.category];

          return (
            <li
              key={icon.id}
              className={`relative pl-16 pb-16 sm:pl-0 sm:pb-20 ${
                isLeft ? "sm:pr-[52%]" : "sm:pl-[52%]"
              }`}
            >
              {/* Spine node */}
              <span
                aria-hidden
                className="absolute left-6 top-2 -translate-x-1/2 sm:left-1/2"
              >
                <span className="block h-3 w-3 rounded-full bg-yif-gold ring-4 ring-yif-cream" />
              </span>

              <button
                type="button"
                onClick={() => setActiveId(isActive ? null : icon.id)}
                // biome-ignore lint/a11y/useAriaPropTypes: dynamic boolean state derived from React state
                aria-expanded={isActive}
                aria-controls={`timeline-card-${icon.id}`}
                className={`group block w-full text-left ${
                  isLeft ? "sm:text-right" : "sm:text-left"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-yif-gold">
                  {icon.era} · {icon.lifespan}
                </p>

                <div
                  className={`mt-3 flex items-center gap-4 ${
                    isLeft ? "sm:flex-row-reverse" : ""
                  }`}
                >
                  <span className="relative inline-block h-16 w-16 overflow-hidden rounded-full bg-yif-navy/10 ring-2 ring-yif-gold/40 transition-transform group-hover:scale-105">
                    <Image
                      src={icon.imageUrl}
                      alt={icon.imageAlt}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                    />
                  </span>
                  <span>
                    <span className="block font-display text-2xl text-yif-navy transition-colors group-hover:text-yif-gold">
                      {icon.name}
                    </span>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${cat.bg} ${cat.text} ${cat.ring}`}
                    >
                      {cat.label}
                    </span>
                  </span>
                </div>

                <p
                  className={`mt-3 max-w-md text-sm leading-relaxed text-yif-charcoal/85 ${
                    isLeft ? "sm:ml-auto" : ""
                  }`}
                >
                  {icon.shortBio}
                </p>

                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-yif-navy">
                  {isActive ? "Hide profile" : "Open profile"}
                  <span aria-hidden>{isActive ? "−" : "+"}</span>
                </span>
              </button>

              {isActive && (
                <div
                  id={`timeline-card-${icon.id}`}
                  className={`mt-6 max-w-md ${isLeft ? "sm:ml-auto" : ""}`}
                >
                  <IconCard icon={icon} size="md" />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
