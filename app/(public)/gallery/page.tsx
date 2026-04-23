import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "View photos and videos from YIF events, cultural activities, and community programmes.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-[var(--yif-navy)]">
        Gallery
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">Coming soon.</p>
    </div>
  );
}
