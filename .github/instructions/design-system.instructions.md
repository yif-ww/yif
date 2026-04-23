---
applyTo: "app/**/*.tsx,app/**/*.ts,components/**/*.tsx"
---

# YIF Design System — Enforced Conventions

## Brand Token Baseline (globals.css)

Add these CSS variables before building any new page:

```css
/* YIF Brand Tokens */
--color-yif-navy: #1a2744;
--color-yif-gold: #c9913d;
--color-yif-amber: #e8a93e;
--color-yif-terracotta: #c0553a;
--color-yif-green: #2d6a4f;
--color-yif-cream: #f5f0e8;
```

## Typography Rule

NEVER use: Inter, Arial, Roboto, Geist (for display headings), system-ui.  
For display/headings: use a West African-adjacent or editorial serif (e.g., Cormorant Garamond, Playfair Display, EB Garamond, Fraunces).  
For body text: use a refined sans (e.g., DM Sans, Outfit, Plus Jakarta Sans).  
Load via `next/font/google` in `app/layout.tsx`.

## Component Conventions

- Every public page must render trust signals: UN/ECOSOC badge + "IT 28744" registration number.
- `"use client"` only when interactivity is required — prefer Server Components.
- Animation: use CSS `animation-delay` for staggered reveals; avoid JS-animated values that cause layout shifts.
- All images through `next/image` with `alt` text describing cultural context.

## Forbidden Patterns

- ❌ Generic placeholder copy ("Lorem ipsum", "Click here", "Button")
- ❌ Purple gradient backgrounds
- ❌ `pages/` directory or `getServerSideProps`
- ❌ `document.cookie` — use `next/headers` `cookies()`
- ❌ Client-side Paystack secret key access
