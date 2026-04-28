import { getIconsByProgram, type ProgramRelevance } from "@/lib/yoruba-icons";
import { IconCard } from "@/components/icons/IconCard";

interface ProgramIconsProps {
  program: ProgramRelevance;
  /** Section eyebrow */
  eyebrow?: string;
  /** Headline */
  heading?: string;
  /** Supporting copy */
  blurb?: string;
  className?: string;
}

const DEFAULTS: Record<
  ProgramRelevance,
  { eyebrow: string; heading: string; blurb: string }
> = {
  economic: {
    eyebrow: "Karo-Ojire · In their footsteps",
    heading: "Yoruba icons of cooperative prosperity",
    blurb:
      "From Awolowo's regional economy to Ojaja II's diaspora investment — Karo-Ojire walks a well-trodden Yoruba road.",
  },
  education: {
    eyebrow: "Scholarship · In their footsteps",
    heading: "The educators who built our schools",
    blurb:
      "Free education was a Yoruba export long before it was a global ideal. Our scholars stand on this lineage.",
  },
  recognition: {
    eyebrow: "Awards · In their footsteps",
    heading: "Honouring those who honour Yorubaland",
    blurb:
      "The Order of Odua continues a tradition of recognition stretching from the palace at Ife to the global stage.",
  },
  youth: {
    eyebrow: "Youth · In their footsteps",
    heading: "Mentors for the next generation",
    blurb:
      "Every Yoruba youth today inherits the courage of activists, the rigor of scholars, and the vision of monarchs.",
  },
};

/**
 * Programs-page slot showing Yoruba icons relevant to a specific
 * programme pillar.
 */
export function ProgramIcons({
  program,
  eyebrow,
  heading,
  blurb,
  className,
}: ProgramIconsProps) {
  const icons = getIconsByProgram(program);
  if (icons.length === 0) return null;

  const copy = DEFAULTS[program];

  return (
    <section
      className={`relative bg-yif-cream py-20 sm:py-24 ${className ?? ""}`}
    >
      <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-14">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-yif-gold">
              {eyebrow ?? copy.eyebrow}
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-yif-navy sm:text-4xl">
              {heading ?? copy.heading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-yif-charcoal/80">
              {blurb ?? copy.blurb}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {icons.map((icon, idx) => (
            <IconCard key={icon.id} icon={icon} size="md" delayMs={idx * 90} />
          ))}
        </div>
      </div>
    </section>
  );
}
