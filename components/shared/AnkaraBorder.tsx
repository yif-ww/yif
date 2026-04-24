import Image from "next/image";

/**
 * Decorative Ankara/Yoruba textile border strip.
 *
 * variant="top"    → strip sits at the TOP of a section (pattern band on top, ornaments hang down)
 * variant="bottom" → strip sits at the BOTTOM of a section (ornaments point up, pattern band on bottom)
 *
 * Usage:
 *   <AnkaraBorder variant="bottom" />   ← end of a navy hero
 *   <AnkaraBorder variant="top" />      ← start of a navy footer
 */
export function AnkaraBorder({
  variant = "top",
  className = "",
  heightClass = "h-16 sm:h-20 md:h-24",
}: {
  variant?: "top" | "bottom";
  /** Override height via Tailwind class */
  heightClass?: string;
  className?: string;
}) {
  const src =
    variant === "top"
      ? "/image/yoruba-ankara-patterns/1-top.png"
      : "/image/yoruba-ankara-patterns/1-bottom.png";

  return (
    <div
      aria-hidden
      className={`w-full ${heightClass} ${className}`}
      style={{
        backgroundImage: `url('${src}')`,
        backgroundRepeat: "repeat-x",
        backgroundSize: "auto 100%",
      }}
    />
  );
}

/**
 * Full-width ankara texture overlay — use as an absolute background layer
 * inside a relatively-positioned section container.
 *
 * <div className="relative">
 *   <AnkaraTexture pattern="diagonal" opacity={0.08} />
 *   <div className="relative z-10">...content...</div>
 * </div>
 */
export function AnkaraTexture({
  pattern = "diagonal",
  opacity = 0.08,
  className = "",
}: {
  /** "diagonal" = pattern 2 (orange cross-weave), "medallion" = pattern 4 (carpet medallion) */
  pattern?: "diagonal" | "medallion";
  /** 0–1 opacity */
  opacity?: number;
  className?: string;
}) {
  const src =
    pattern === "diagonal"
      ? "/image/yoruba-ankara-patterns/2.png"
      : "/image/yoruba-ankara-patterns/4.png";

  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      style={{ opacity }}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority={false}
      />
    </div>
  );
}
