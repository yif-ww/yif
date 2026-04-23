<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# YIF — Yoruba Indigenes' Foundation Website

A Next.js 16 greenfield build for the official digital platform of the Yoruba Indigenes' Foundation (UN/ECOSOC consultative status NGO). Transform the current skeleton into a world-class nonprofit platform.

## Project Context

- **PRD:** [docs/Product Requirements Document (PRD).md](<docs/Product%20Requirements%20Document%20(PRD).md>) — full page specs, feature list, success metrics. **Read this before building any page or feature.**
- **Content inventory:** [docs/YIF Website Content Inventory.md](docs/YIF%20Website%20Content%20Inventory.md) — all real text, leadership names, mission statements, and org data to use verbatim.

## Stack

| Layer           | Choice             | Version                |
| --------------- | ------------------ | ---------------------- |
| Framework       | Next.js App Router | 16.2.4                 |
| UI              | React              | 19.2.4                 |
| Styling         | Tailwind CSS v4    | `@tailwindcss/postcss` |
| Language        | TypeScript         | 5 (strict)             |
| Package manager | pnpm               | —                      |

## Commands

```bash
pnpm dev        # start dev server (Turbopack, default in Next.js 16)
pnpm build      # production build
pnpm lint       # eslint
```

## Architecture

```
app/            # App Router — all routes live here
  layout.tsx    # root layout (Geist fonts, Tailwind base already wired)
  globals.css   # @import "tailwindcss"; + @theme inline CSS vars
public/         # static assets
docs/           # PRD + content inventory (do not ship these)
```

Route convention: `app/(public)/` for public pages, `app/(auth)/` for member-only pages. Create these groups when building routes.

## Next.js 16 Critical Rules

- **Async params**: `params` and `searchParams` are `Promise<…>` — always `await` them. `cookies()` and `headers()` are also async.
- **Parallel routes**: every parallel route slot needs a `default.js` or it 404s.
- **Cache components**: use `"use cache"` directive (not `cache:` option). APIs: `revalidateTag()`, `updateTag()`.
- **No `pages/` directory**: App Router only. No `getServerSideProps` / `getStaticProps`.
- **Server Actions**: define in `"use server"` files or inline in Server Components — never in Client Components directly.

When in doubt, apply the `nextjs` skill: it documents 25 known Next.js 16 errors with solutions.

## Styling Conventions

- Tailwind v4: use `@theme inline` in `globals.css` for CSS variable tokens (already bootstrapped).
- Define YIF brand colors as CSS variables in `globals.css`, consume via `--color-*` tokens in Tailwind classes.
- Do **not** use `tailwind.config.js` — Tailwind v4 is config-free.
- Dark mode via `prefers-color-scheme` media query (already in `globals.css`).

## Design Mandate — Cultural Identity

Every UI must feel like it was **designed for YIF**, not generated generically:

- **Palette**: draw from Yoruba cultural colors — deep indigo/navy, warm gold/amber, earthy terracotta, forest green. Avoid purple-gradient-on-white clichés.
- **Typography**: pair a distinctive West African/editorial display font with a refined, readable body font. No Inter, Arial, or Roboto.
- **Motion**: staggered reveals on page load, cultural pattern textures as backgrounds, animated stat counters on homepage.
- **Trust signals**: UN/ECOSOC badge, registration number (IT 28744), leadership credentials — always visible on public pages.

Apply the `frontend-design` skill for every page or component build. It enforces bold aesthetic direction and prevents generic AI aesthetics.

## Key Features to Build (in PRD order)

1. Homepage with hero, animated stats, program cards, testimonials
2. About Us — leadership grid, diaspora map, timeline
3. Programs & Initiatives — Karo-Ojire, Scholarship, Events, Youth
4. Events & Ticketing — calendar, event cards, Paystack/Flutterwave checkout
5. Donations — one-time + recurring, impact transparency
6. Scholarship portal — multi-step application form
7. Blog & News — card listing, rich post view, social share
8. Contact — Google Maps, contact form, WhatsApp CTA
9. Auth (member portal) — dashboard, profile, ticket history

## Payments

Paystack is the primary gateway (Nigeria/Africa), Flutterwave as fallback. Apply the `paystack-setup` skill before touching any payment code. Never expose secret keys client-side — all Paystack calls go through Server Actions or Route Handlers.

## Security Baseline

- Validate all form inputs server-side (Zod preferred).
- Sanitize any user-generated content before rendering.
- Use `next/headers` for cookie access — never `document.cookie`.
- CSRF protection is built-in to Server Actions — use them over raw API routes for mutations.
