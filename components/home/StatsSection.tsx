"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 2500, suffix: "+", label: "Members Worldwide" },
  { value: 20, suffix: "+", label: "Global Chapters" },
  { value: 15, suffix: "+", label: "Countries Represented" },
  { value: 20, suffix: "+", label: "Years of Impact" },
] as const;

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = spanRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const DURATION = 1800;
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / DURATION, 1);
            // ease-out-cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(value);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={spanRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="bg-[var(--yif-cream)] border-y border-[var(--yif-gold)]/15 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center"
            >
              {/* Animated number */}
              <div className="font-display text-5xl sm:text-6xl font-semibold text-[var(--yif-gold)] leading-none mb-3">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              {/* Gold separator */}
              <div className="w-8 h-px bg-[var(--yif-gold)]/40 mb-3" />
              {/* Label */}
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--yif-charcoal)]/55">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
