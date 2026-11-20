# YIF Member App: Build Plan

**Version:** 1.2 · **Date:** 20 November 2026 · **Status:** Approved. M0, M1 and M2 complete
**Source of truth for scope:** [YIF Member App PRD](YIF%20Member%20App%20PRD.md) (v1.1) and the [sample screens](member-app-screens/)

This plan explains how the MVP described in the PRD will be built: in what order, in which repositories, and how each step is checked before the next one starts.

---

## 1. Approach

The app needs two pieces of work that move together:

| Track | Repository | What it delivers |
| :--- | :--- | :--- |
| **Mobile app** | New repo `yif-mobile` (sibling of this one) | The Flutter app for iOS and Android |
| **Backend** | This repo (`yif`), on a new branch `feat/mobile-api` | Mobile API, bearer sign-in, payment fixes, new tables |

The order follows three rules:

1. **Contract first.** The API's request and response shapes are written down before either side is built, so the app and the backend agree.
2. **Screens before wiring.** The app is first built against sample data that matches the sample screens. This gives a working demo early and keeps UI work separate from backend risk.
3. **Payments fixed before the app takes money.** Gaps G1 to G5 (PRD Section 2.2) are fixed before any checkout is connected. These fixes also protect the website's live payments today.

---

## 2. Milestones

Each milestone ends with a check that must pass before the next one starts.

| # | Milestone | Track | Done when |
| :---: | :--- | :--- | :--- |
| **M0** | Setup and API contract | Both | Both repos build, and the API contract is agreed |
| **M1** | App foundation and screens on sample data | App | All 15 screens run on the Android emulator and match the sample images |
| **M2** | Backend foundations and payment fixes | Backend | Bearer sign-in works, the read-only endpoints respond, and G1 to G5 are fixed and tested |
| **M3** | Sign-in and read-only features on real data | App | A real test account can sign in and see the home screen, card, profile, news and payment history |
| **M4** | Membership renewal | Both | A test renewal through Paystack and Stripe extends the membership exactly once, even if the app is closed |
| **M5** | Events and tickets | Both | A test ticket purchase produces a QR ticket that opens offline |
| **M6** | Door check-in | Both | An organizer can scan tickets in airplane mode, and check-ins sync with no duplicates |
| **M7** | Notifications | Both | Push messages arrive, open the right screen and respect preferences |
| **M8** | Sponsorship | Both | Admins can schedule and approve a placement, and it appears on Home and Event details |
| **M9** | Hardening and release | Both | Release builds pass the launch checklist (Section 7) |

---

## 3. Milestone Details

### M0: Setup and API contract

**App**
- Create the Flutter project `yif-mobile` with organization ID `org.yifww` and app ID `org.yifww.members` (permanent once published, so confirm first).
- Set up three environments (development, staging, production) using `--dart-define-from-file`, so no server address is hard-coded.
- Add linting (`very_good_analysis` or `flutter_lints`), formatting and a basic CI workflow that runs analysis and tests.

**Backend**
- Create branch `feat/mobile-api` from `test`.
- Read the relevant Next.js 16 guides in `node_modules/next/dist/docs/` before adding routes (project rule).

**Contract**
- Write `docs/mobile-api-contract.md` in this repo: every route in PRD Section 8.2, with request fields, response fields, error format and status codes.
- One error format for every route: `{ "error": { "code": "...", "message": "..." } }`.
- The app copies these shapes into Dart models. The backend uses the same shapes as Zod schemas.

### M1: App foundation and screens on sample data

**Structure** (feature-first):

```
lib/
  main.dart                 # starts the app for the chosen environment
  app/                      # MaterialApp, router, theme
  core/
    config/                 # environment settings
    network/                # dio client, auth header, error mapping
    storage/                # secure storage, Drift database
    theme/                  # colors, typography, spacing, adire pattern
    widgets/                # shared buttons, cards, skeletons, empty/error states
    l10n/                   # all user-facing text (English now, Yoruba later)
  features/
    auth/ home/ membership/ donate/ events/ tickets/
    check_in/ news/ notifications/ profile/ sponsors/
      data/                 # API calls, local cache, repository
      domain/               # models
      presentation/         # screens, widgets, Riverpod providers
```

**Work**
- Design system from PRD Section 9: color tokens, Cormorant Garamond and DM Sans bundled as font files (not downloaded at runtime, so they work offline), and the adire pattern as an asset.
- Check both fonts render every Yoruba character used in the app (for example "Ẹ káàárọ̀"), and bundle a fallback if any are missing.
  - **Result:** Cormorant Garamond covers everything. DM Sans has no Yoruba under-dot letters (Ẹ ẹ Ọ ọ Ṣ ṣ) or naira sign (₦), so a 79 KB subset of Noto Sans is bundled as a fallback.
- Navigation with `go_router`: a bottom bar for Home, Events, Card, News and Profile, plus the other screens as pushed routes.
- Build all 15 screens against **fake repositories** that return the sample data from PRD Appendix A.
- Every screen handles loading, empty, offline and error states (PRD Section 6.5).
- Accessibility: 44-point touch targets, screen reader labels, and layouts that hold up at large system text sizes.

**Check:** golden tests (image snapshots) for each screen, compared by eye against `docs/member-app-screens/`.

### M2: Backend foundations and payment fixes

Before writing payment code, apply the `paystack-setup` and `paystack-webhooks` skills (project rule).

| Step | Change | Fixes |
| :--- | :--- | :--- |
| 1 | Add a Paystack webhook route that verifies the signature and fulfils payments | G1 |
| 2 | Move fulfilment into one shared, idempotent function used by the webhook, the callback page and Stripe | G1 |
| 3 | Generate membership numbers from a database sequence | G2 |
| 4 | Extend renewals from the current expiry date when the member renews early | G3 |
| 5 | Write a `Ticket` row for each confirmed purchase, linked to its tier and transaction | G4 |
| 6 | Hold capacity during checkout (pending tickets with an expiry time, not a counter), confirm it on payment (`sold`) and release it on failure or expiry | G5 |
| 7 | Enable the Better Auth `bearer` plugin and turn on sign-in rate limiting | G7 |
| 8 | Apply the database changes in PRD Section 8.3 as one Prisma migration | G4, G5, G8 |
| 9 | Build the read-only routes: `/me`, `/membership`, `/membership/tiers`, `/payments`, `/events`, `/news` | G6 |
| 10 | Sign QR tokens with an Ed25519 private key held on the server, and publish the public key for the app | Section 8.4 |

**Tests:** add Vitest to this repo for the fulfilment logic. Cover repeated webhooks, early renewal, membership number generation and two buyers racing for the last ticket.

**Check:** `pnpm build` and `pnpm lint` pass, the tests pass, and the website's existing checkout still works with test keys.

### M3: Sign-in and read-only features on real data

- Sign in with email and password against `/api/auth/sign-in/email`, and store the session token only in secure storage.
- Offer fingerprint or Face ID after the first sign-in (`local_auth`). This unlocks the stored token and is not a separate login.
- "Forgot password" calls the existing reset email.
- Replace the fake repositories with real ones for Home, Card, Profile, News and Payment history.
- Cache in Drift: the membership card and its signed token, recently read articles and the profile.
- If the server rejects the token, sign the member out cleanly.

**Check:** with the test account, every read-only screen shows real data, and the card still opens in airplane mode.

### M4: Membership renewal

- `POST /membership/checkout` takes only the tier and currency. The server sets the price.
- Checkout opens in an in-app browser (`url_launcher`, in-app browser mode).
- The return link is a verified HTTPS link (`https://www.yifww.org/app/return`). This repo serves `apple-app-site-association` and `assetlinks.json` from `public/.well-known/`.
- The app then asks `/payments/{reference}` for the result, showing "We're confirming your payment" while the webhook is pending.

**Check:** PRD Section 7.1 acceptance criteria pass with Paystack and Stripe test keys, including closing the app during payment.

### M5: Events and tickets

- Event list (Upcoming, My tickets, Past), event details, tier selection and quantity limited by remaining capacity.
- `POST /events/{slug}/checkout` reserves capacity, then follows the same checkout and return flow as M4.
- Tickets are stored in Drift with their signed QR tokens, so they open offline.
- Add to calendar (`add_2_calendar`) and directions (opens the phone's maps app).

**Check:** PRD Section 7.2 acceptance criteria pass.

### M6: Door check-in

- Add the `organizer` role, and an admin page in this repo to assign organizers to events.
- The organizer downloads the event's guest list into Drift.
- `mobile_scanner` reads the QR code. The app checks the signature offline, then looks up the ticket in the guest list.
- Each scan shows **Valid**, **Already used**, **Wrong event** or **Not recognized**, using words and icons as well as color.
- Check-ins are queued locally and uploaded in batches with `POST /organizer/check-ins`. Each check-in has its own ID, so retries never duplicate.
- The server flags tickets admitted by two phones for the event lead.

**Check:** PRD Section 7.3 acceptance criteria pass, tested with two phones in airplane mode.

### M7: Notifications

- Create the Firebase project and connect the app (Firebase Cloud Messaging) for Android and iOS.
- `POST /devices` registers the push token, and sign-out removes it.
- The server sends push messages with `firebase-admin` and writes each one to the `Notification` inbox table.
- A daily scheduled job sends renewal reminders (30, 7 and 1 days before expiry, and on expiry) and event reminders.
- Ask for notification permission after sign-in, with a short explanation first.

**Check:** PRD Section 7.4 acceptance criteria pass on a real Android phone.

### M8: Sponsorship

- Web admin in this repo: sponsors, placements, second-admin approval, immediate stop and a downloadable report.
- `GET /placements` serves active placements. `POST /placements/stats` receives daily view and tap totals with no member IDs.
- App: the Home partner card and the "Presented by" line, with a YIF promotion when no sponsor is booked.
- Sponsor images load in the background and never delay the screen.

**Check:** PRD Section 11.5 acceptance criteria pass.

### M9: Hardening and release

- Crash reporting with Sentry in the app.
- Account deletion (`DELETE /me`) in the app, as Apple requires.
- Test on a low-cost Android phone and on a slow network.
- Security review of the mobile API: every route checks the user and role on the server.
- Store listings, screenshots, privacy details, the Google Play ads declaration and reviewer notes about membership benefits.
- Pilot at one YIF event, then a phased public release.

---

## 4. Packages

The latest stable versions are checked when the project is created.

| Concern | Package |
| :--- | :--- |
| State | `flutter_riverpod` |
| Navigation and links | `go_router`, `app_links` |
| Networking | `dio` |
| Models | Plain Dart classes, with JSON parsing written by hand from M3. Code generation is added only if the models grow |
| Local database | `drift` |
| Secure storage | `flutter_secure_storage` |
| Biometrics | `local_auth` |
| QR codes | `qr_flutter`, `mobile_scanner` |
| Signature checks | `cryptography` (Ed25519) |
| Push | `firebase_core`, `firebase_messaging` |
| Browser and maps | `url_launcher` |
| Calendar | `add_2_calendar` |
| Sharing | `share_plus` |
| Screen brightness | `screen_brightness` |
| Article rendering | `flutter_widget_from_html_core` |
| Crash reporting | `sentry_flutter` |

---

## 5. Testing

| Level | App | Backend |
| :--- | :--- | :--- |
| Unit | Repositories, token checks, offline queue | Fulfilment, capacity, numbering, QR signing |
| Screen | Widget and golden tests for each screen | — |
| End to end | `integration_test` on the Android emulator | Test-mode Paystack and Stripe payments |
| Real world | Pilot event with two phones at the door | Webhook delivery monitored during the pilot |

---

## 6. What Is Needed From YIF or the Team

| Item | Needed by | Why |
| :--- | :--- | :--- |
| Confirm the app ID `org.yifww.members` and the store name | M0 | The app ID cannot change after release |
| Paystack and Stripe **test** keys in the development environment | M2 | To test payments safely |
| A test member account and an organizer test account | M3 | To check real data |
| A Mac or a cloud build service (such as Codemagic) | M3, for iOS | iOS apps cannot be built on Windows |
| Firebase project owner | M7 | Push notifications |
| Apple and Google developer accounts for YIF (PRD decision 4) | Start now | Enrollment can take weeks |
| Answers to the open PRD decisions (Section 14) | As listed there | Prices, logo, domain and organizers |

---

## 7. Launch Checklist

- [ ] All PRD acceptance criteria pass (Sections 7 and 11.5)
- [ ] No secret keys in the app or its repository
- [ ] Release builds signed with YIF-owned keys, with the keys backed up
- [ ] Privacy policy updated for the app, push notifications and sponsor content
- [ ] Account deletion works from the app
- [ ] Store listings, screenshots and reviewer notes ready
- [ ] Pilot event completed with no unresolved door problems

---

## 8. Development Environment

Checked on 18 November 2026:

| Item | Status |
| :--- | :--- |
| Flutter 3.47.2 (stable) | Installed |
| Android SDK 36.1 and the `Medium_Phone_API_36.1` emulator | Installed. Accept the Android licenses with `flutter doctor --android-licenses` |
| Java 17 | Installed |
| iOS builds | Not possible on this Windows machine. Needs a Mac or a cloud build service |

---

## 9. Progress Log

| Date | Milestone | Result |
| :--- | :--- | :--- |
| 19 Nov 2026 | M0 | Flutter project `yif-mobile` created with app ID `org.yifww.members`. Branch `feat/mobile-api` created in this repo. API contract written in `docs/mobile-api-contract.md` |
| 19 Nov 2026 | M1 | All 15 screens built on sample data, with loading, empty and error states, all text in one localization file, and unit, screen and screenshot tests |
| 20 Nov 2026 | M2 | Payment fixes G1 to G5, mobile sign-in, rate limiting, QR signing and the read-only mobile API, on branch `feat/mobile-api`. 23 fast tests and 45 database tests pass, and the project type-checks. **Not yet deployed or committed.** See `docs/M2 Release Checklist.md` |
| 20 Nov 2026 | M3 | The app signs in with the website account, keeps the token in secure storage, offers fingerprint unlock, and reads Home, Card, Profile, News, Events, Tickets and Payments from the real API, with the card, tickets and payments saved for offline use. Checked against a real local server and database. **Not yet tried on a phone against a deployed server** (M2 must be deployed first) |

**Decisions made during M0 and M1**

- **Sample check-in:** Door check-in steps through sample codes because there is no camera scanning yet. The real scanning rules (signature, wrong event, already used, part-used tickets) are already in place and tested, so M6 only adds the camera and offline storage.
- **Calendar and directions:** These open Google Calendar and Google Maps links for now. M5 adds the phone's own calendar sheet.
- **Sign-in screen:** In sample mode the form is prefilled, and the fingerprint button signs in the sample account. Real fingerprint and Face ID unlock arrives in M3.
- **Edit profile:** This opens the website's settings page until in-app editing arrives with the live API in M3.
- **Text size:** The app follows the phone's text size up to 160%. Every screen is tested at that size.
- **Home greeting:** The greeting changes with the time of day (Ẹ káàárọ̀, Ẹ káàsán, Ẹ kúrọ̀lẹ́). A Yoruba speaker should confirm the spelling and tone marks.
- **Donate link:** The app opens `/donate?cause=<cause>`. The website's donation form now preselects that cause, on branch `feat/mobile-api`.

**Built in M2**

| Step | Result |
| :--- | :--- |
| Paystack webhook (G1) | `POST /api/paystack/webhook` verifies the signature, re-checks the payment with Paystack, and fulfils it. It answers 500 on failure so Paystack retries |
| One shared fulfilment (G1) | `lib/fulfillment.ts` serves the webhook, both return pages and Stripe. `Transaction.fulfilledAt` is set in the same database transaction as the change, so a payment is applied exactly once even when callers run at the same moment |
| Membership numbers (G2) | Taken from a database sequence that continues after the highest number already issued |
| Early renewal (G3) | Renewals add a year to the current expiry date. First activations and upgrades are unchanged |
| Tickets (G4) | A ticket row is created for every purchase, with a short reference such as `YIF-TK-8F3K2P`, and an inbox notification |
| Capacity (G5) | Seats are held for 15 minutes while paying. Both website ticket forms now check seats first and say "only N left" or "sold out" |
| Renewal receipt | New email for renewals and upgrades. Reloading a payment page no longer re-sends emails |
| Mobile sign-in | Bearer tokens on the existing accounts, and sign-in attempts limited to 5 per minute per address, stored in the database |
| QR signing | Ed25519 signing in `lib/qr-token.ts`, with `pnpm qr:keygen` to create the key. A test confirms the app's parser reads real server tokens |
| Mobile API | Read-only routes for account, membership, card, tiers, payments, events, tickets, news and signing keys. Contract: `docs/mobile-api-contract.md` |
| Donate link | The donation form preselects the cause from `?cause=` |

**Decisions made during M2**

- **Seat holds, not a `reserved` counter.** A counter can drift when a checkout is abandoned. A pending ticket with an expiry time cannot, and needs no cleanup job. The PRD's database section is updated.
- **Late payments are honoured.** If a buyer pays after the hold ended and the seats are gone, the ticket is still confirmed and flagged `OVERSOLD` in the transaction notes. Turning away a paid customer is worse than a rare oversell.
- **Upgrades keep today's rule.** Only same-tier renewals now extend from the current expiry. Changing upgrades to extend as well would give members who upgrade mid-year more than a year, which is a pricing decision for YIF.
- **Sessions stay at 7 days.** This is Better Auth's default for the website too. A longer session for the app would also lengthen website sessions.
- **Event times are read as Nigerian time** for events in Nigeria or with no country. Events store a date and a time of day with no time zone. For other countries only the date is trusted, and the app shows the time text as entered.
- **Event ticket prices are NGN only** in the mobile API for now. The website sells Yoruba World Day passes in USD through a separate price constant.
- **Door check-in access comes from event assignments**, not a new user role.
- **No per-account sign-in limit yet.** The limit is per address. An attack spread across many addresses against one account is not slowed by it.
- **Membership numbers continue from the highest one already issued.** Numbers now count up across years, so the number is unique but no longer restarts each January. If a number is ever entered by hand, make sure the sequence still sits above it.


**Decisions made during M3**

- **Saved data is plain JSON files, not Drift.** M3 only saves a few small documents (the profile with the card token, payments, tickets, articles). A key-value file cache does that with no code generation or native database, and it keeps builds fast. Drift joins in M6, where check-ins and the guest list need real queries and a write queue.
- **Fingerprint unlock only opens the saved session.** It is not a separate login and nothing about it reaches the server. If the phone later loses its screen lock, the saved sign-in opens without a prompt rather than locking the member out. Signing out turns it off, so the next sign-in asks again.
- **Cold start only.** The app asks for the fingerprint when it starts, not each time it returns from the background. A timed re-lock is a product choice for M9.
- **Offline rules.** Only a missing connection falls back to saved data. If the server answers with an error, the error is shown, so old data never hides a real problem. A saved card token is used only until its own expiry, and a membership whose expiry date has passed shows as expired even offline.
- **Features whose server routes arrive later** show gracefully in live mode: renewing and buying tickets open the website for now (M4 and M5 replace this), the notification inbox is empty (M7), no sponsor card appears (M8), and door check-in says it is coming soon (M6).
- **Forgot password** opens the website's reset page, which sends the reset email, so there is one reset flow to maintain.
- **Delete account** shows a short message in live mode until the server route exists (M9). Apple requires in-app deletion before the App Store release.
- **Payments marked abandoned or reversed** show as "Failed" in the app. The member did not end up paying, or got the money back.
- **Pictures are not saved offline.** Event and article pictures load from the web each time. Offline picture saving is M9 polish.
- **Local demo server.** `scripts/demo-mobile-api.mts` in the website repo serves the real route handlers over a throwaway database with a demo member, so the app and its live tests can run with no deployed server. Demo sign-in: `member@example.com` / `demo-password-123`.
