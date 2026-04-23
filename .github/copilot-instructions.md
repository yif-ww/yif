<!-- See AGENTS.md for the full agent guide -->

@AGENTS.md

## Skill Auto-Triggers

| Trigger                                                       | Skill to load                                          |
| ------------------------------------------------------------- | ------------------------------------------------------ |
| Building any page, component, or UI                           | `frontend-design`                                      |
| Next.js 16 errors, async params, "use cache", parallel routes | `nextjs`                                               |
| Any payment code (Paystack, Flutterwave, donations, tickets)  | `paystack-setup` → then the relevant paystack-\* skill |
| Forms with validation (scholarship, contact, membership)      | validate server-side with Zod                          |
| Auth / member portal work                                     | `better-auth-best-practices`                           |

## Path Aliases

`@/*` maps to the workspace root (see `tsconfig.json`).  
Use `@/app/...`, `@/lib/...`, `@/components/...` for absolute imports.

## Content Source of Truth

Never invent org data. All copy, names, positions, and registration numbers live in  
[docs/YIF Website Content Inventory.md](../docs/YIF%20Website%20Content%20Inventory.md).
