import Image from "next/image";
import { getIconsTimeline } from "@/lib/yoruba-icons";
import { IconsTimelineClient } from "./IconsTimelineClient";

/**
 * About-page interactive timeline of Yoruba leaders.
 * Server component renders ordered structure; the client wrapper
 * handles modal interactions on each entry.
 */
export function IconsTimeline() {
  const timeline = getIconsTimeline();

  return (
    <section id="yoruba-icons" className="relative bg-yif-cream py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        <div className="mb-16 max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-yif-gold">
            A Lineage of Leadership
          </p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-yif-navy sm:text-5xl">
            One hundred and twenty years of Yoruba influence — woven through one
            timeline.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-yif-charcoal/80">
            Hover any portrait for a quick read. Open a profile to explore the
            full legacy and the YIF programmes it inspires.
          </p>
        </div>

        {/* Pre-render timeline shell with images for SEO; client adds interactions. */}
        <IconsTimelineClient icons={timeline} />

        {/* Static SEO list (visually hidden lookalike, indexable) */}
        <ul className="sr-only">
          {timeline.map((i) => (
            <li key={i.id}>
              <Image src={i.imageUrl} alt={i.imageAlt} width={60} height={60} />
              {i.name} — {i.title} ({i.lifespan}). {i.shortBio}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
