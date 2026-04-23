import type { Metadata } from "next";
import Link from "next/link";
import {
  BLOG_POSTS,
  CATEGORY_COLORS,
  CATEGORY_GRADIENTS,
  formatDate,
  type BlogPost,
} from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog & News | Yoruba Indigenes' Foundation",
  description:
    "Stay informed with the latest news, cultural insights, and community updates from the Yoruba Indigenes' Foundation.",
  openGraph: {
    title: "Blog & News | YIF",
    description:
      "News, cultural insights, and community updates from the Yoruba Indigenes' Foundation worldwide.",
    type: "website",
  },
};

function CategoryBadge({ category }: { category: BlogPost["category"] }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
      style={{ backgroundColor: CATEGORY_COLORS[category] }}
    >
      {category}
    </span>
  );
}

function PostCard({ post, index }: { post: BlogPost; index: number }) {
  return (
    <article
      className="animate-fade-up group flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-shadow duration-300 hover:shadow-xl"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      {/* Gradient banner */}
      <Link
        href={`/blog/${post.slug}`}
        className="block"
        aria-label={post.title}
      >
        <div
          className={`relative h-52 w-full bg-gradient-to-br ${CATEGORY_GRADIENTS[post.category]} overflow-hidden`}
        >
          {/* Adinkra-inspired SVG pattern overlay */}
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full opacity-10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`grid-${post.slug}`}
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
                  strokeWidth="1.5"
                />
                <line
                  x1="0"
                  y1="20"
                  x2="40"
                  y2="20"
                  stroke="white"
                  strokeWidth="0.5"
                />
                <line
                  x1="20"
                  y1="0"
                  x2="20"
                  y2="40"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${post.slug})`} />
          </svg>
          {/* Category initial mark */}
          <div className="absolute bottom-4 left-5 text-white/20 font-display text-8xl font-bold leading-none select-none">
            {post.category.charAt(0)}
          </div>
          {/* Badge overlay */}
          <div className="absolute left-5 top-5">
            <CategoryBadge category={post.category} />
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-3 text-xs text-[var(--muted)]">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readTime} min read</span>
        </div>

        <Link href={`/blog/${post.slug}`} className="group/title block flex-1">
          <h2 className="mb-3 font-display text-2xl font-semibold leading-snug text-[var(--yif-navy)] transition-colors group-hover/title:text-[var(--yif-gold)]">
            {post.title}
          </h2>
          <p className="text-sm leading-relaxed text-[var(--muted)] line-clamp-3">
            {post.excerpt}
          </p>
        </Link>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--yif-cream-dark)] pt-4">
          <div>
            <p className="text-sm font-semibold text-[var(--yif-charcoal)]">
              {post.author}
            </p>
            <p className="text-xs text-[var(--muted)]">{post.authorRole}</p>
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--yif-gold)] transition-gap hover:gap-2.5"
            aria-label={`Read full article: ${post.title}`}
          >
            Read
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="transition-transform group-hover:translate-x-1"
            >
              <path
                d="M1 7h12M8 3l5 4-5 4"
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
}

export default function BlogPage() {
  const categories = Array.from(new Set(BLOG_POSTS.map((p) => p.category)));

  return (
    <>
      {/* ── Hero ── */}
      <section className="pattern-adinkra relative overflow-hidden bg-[var(--yif-navy)] py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--yif-navy-dark)] via-transparent to-[var(--yif-navy-light)]/40" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="animate-fade-up mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--yif-gold)]">
            News &amp; Perspectives
          </p>
          <h1 className="animate-fade-up font-display text-5xl font-semibold text-white sm:text-6xl [animation-delay:80ms]">
            Our Blog
          </h1>
          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 [animation-delay:160ms]">
            Culture, politics, events, and youth development — perspectives from
            Yoruba communities around the world.
          </p>
        </div>
      </section>

      {/* ── Category strip ── */}
      <section className="sticky top-0 z-10 border-b border-[var(--yif-cream-dark)] bg-[var(--yif-cream)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Topics:
          </span>
          {categories.map((cat) => (
            <span
              key={cat}
              className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
              style={{
                borderColor: CATEGORY_COLORS[cat],
                color: CATEGORY_COLORS[cat],
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── Post grid ── */}
      <section className="bg-[var(--yif-cream)] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
            {BLOG_POSTS.map((post, i) => (
              <PostCard key={post.slug} post={post} index={i} />
            ))}
          </div>

          {/* End-of-list note */}
          <div className="mt-16 border-t border-[var(--yif-cream-dark)] pt-10 text-center">
            <p className="text-sm text-[var(--muted)]">
              More articles coming soon.{" "}
              <Link
                href="/contact"
                className="font-semibold text-[var(--yif-gold)] underline-offset-4 hover:underline"
              >
                Get in touch
              </Link>{" "}
              to contribute a piece.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
