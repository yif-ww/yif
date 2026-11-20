# Product Requirements Document (PRD)
## Yoruba Indigenes' Foundation (YIF) Member App: Flutter MVP

**Document Version:** 1.1 (Draft for review)
**Last Updated:** November 18, 2026
**Project Name:** YIF Member App
**Platforms:** iOS and Android (Flutter)
**Sample screens:** [YIF Member App MVP Screens](https://claude.ai/artifact/7tP8X8kjenygfpNhLqgvYj)
**Related documents:** [Website PRD](<Product Requirements Document (PRD).md>), [Content Inventory](<YIF Website Content Inventory.md>)

---

## 1. Executive Overview

YIF members live across Nigeria and the diaspora, and today they manage their membership through the website. The Member App puts the things members need most on their phones: proof of membership, renewal, event tickets and news from the Foundation.

The MVP does one job well: **a member can carry their YIF membership, renew it, buy a ticket, get through the door and stay informed.** It reuses the existing website backend (database, accounts, Paystack and Stripe payments), so members sign in with the account they already have.

The app can also earn income for the Foundation through carefully vetted, clearly labelled sponsorships (Section 11). It will not use third-party ad networks.

Before the app can launch, the website backend needs a small set of fixes. Section 2.2 lists them. Several of them also affect paying members on the website today, so they should be scheduled first regardless of the app.

---

## 2. Current State Assessment

### 2.1 What the app can reuse

| Capability | Already in place |
| :--- | :--- |
| Accounts | Better Auth with email and password, password reset, admin roles |
| Membership | Admin-managed tiers, per-currency prices (NGN, USD, GBP, EUR), member status, expiry and membership numbers |
| Payments | Paystack for NGN, Stripe for USD, GBP and EUR, hosted checkout, full transaction records |
| Events | Events, ticket tiers, agenda, speakers |
| Content | Blog posts and topics |
| Email | Transactional email through Resend |
| Admin | Admin dashboard for members, events, blog, donations and revenue |

### 2.2 Gaps found in the current code

| # | Gap | Effect today | Required for MVP |
| :---: | :--- | :--- | :--- |
| G1 | **No Paystack webhook.** Paystack payments are only fulfilled when the `/payment/callback` page loads. | A member who pays and closes the browser before the redirect finishes is charged but not activated. | Add a signed webhook and one idempotent fulfilment function. |
| G2 | **Membership numbers can collide.** The number is built from the count of active members plus one. When a member expires the count falls, so a number already issued that year can be generated again. The unique constraint then rejects the update and the error is only logged. | A paid new member may not be activated. | Issue numbers from a database sequence. |
| G3 | **Early renewal loses time.** Renewal sets expiry to one year from the payment date. | A member renewing 21 days early loses 21 days. | Extend from the later of today or the current expiry. |
| G4 | **Tickets are not real records.** The `Ticket` table is never written to. Purchases exist only as transactions, and no QR code exists. | Tickets cannot be scanned or checked in. | Create a `Ticket` row for every purchase, with a signed QR code. |
| G5 | **Ticket capacity is not enforced.** `EventTicketTier.sold` is never updated. | Events can oversell. | Reserve capacity at checkout and confirm on payment. |
| G6 | **No mobile API.** Member features run on Server Actions, which Flutter cannot call. | The app has nothing to connect to. | Add a versioned JSON API (Section 8.2). |
| G7 | **No token sign-in.** Better Auth is configured for browser cookies only. | The app cannot hold a session. | Enable the Better Auth bearer plugin. |
| G8 | **No push notifications.** There are no device tokens and no notification inbox. | Reminders are email only. | Add both (Section 8.3). |
| G9 | **No account deletion.** | Apple rejects apps that allow account creation without in-app deletion. | Add deletion (Section 10). |

Two further issues do not block the MVP but should be corrected on the website:

- **Recurring donations are not recurring.** The donation form offers a recurring option, but the member is charged once.
- **The member directory has no opt-in.** Every active member is listed to every signed-in member. The app will not include a directory until members can choose to appear.

---

## 3. Project Goals & Success Metrics

### Primary Goals

1. **Make membership tangible:** give every member a digital card they can show anywhere, even offline.
2. **Improve renewals:** remind members at the right time and make renewing take under a minute.
3. **Modernize events:** replace paper lists with QR tickets and fast door check-in.
4. **Keep members informed:** reach members directly through push notifications and news.
5. **Earn sponsorship income:** give aligned businesses a trusted way to reach members without harming the member experience.

### Success Metrics

These are proposed targets, measured over the first six months after launch.

| Metric | Target |
| :--- | :---: |
| Active members who install the app | 50% |
| Monthly active users, as a share of installs | 40% |
| Members who renew on or before their expiry date | 70% |
| Payment completion rate once checkout opens | 95% |
| Event tickets scanned through the app at the door | 90% |
| Median time to scan and admit one guest | Under 3 seconds |
| Members who allow push notifications | 60% |
| Crash-free sessions | 99.5% |
| App store rating | 4.5+ |
| Paying sponsors | 3 |
| Sponsors who renew after their first term | 50% |

---

## 4. Users & Roles

| Role | Who they are | What they do in the MVP |
| :--- | :--- | :--- |
| **Member** | A registered YIF member | Everything in Section 5 |
| **Organizer** | Staff or volunteers working an event door | Everything a member can do, plus door check-in |
| **Admin** | YIF executives and staff | Continue using the web admin, send announcements from it, and manage sponsors |

People who are not yet members see the welcome screen and are sent to the website to join.

---

## 5. MVP Scope

### 5.1 In scope

| Feature | Summary |
| :--- | :--- |
| Sign in | Existing YIF account, password reset, fingerprint or Face ID |
| Home | Membership status, renewal prompt, next event, shortcuts |
| Digital membership card | Name, tier, number, expiry and QR code, available offline |
| Renewal and upgrade | Renew the current tier or move up, with secure hosted checkout |
| Events | Upcoming and past events, event details, ticket purchase |
| Tickets | QR tickets, available offline, add to calendar, directions |
| Door check-in | Organizers scan tickets, including when the venue has no signal |
| News | Blog posts with topic filters and sharing |
| Notifications | Push notifications and an in-app inbox |
| Profile | Notification preferences, payment history, help, sign out, delete account |
| Donate | Choose a cause, then finish on the website |
| Sponsorship | Home partner card and "Presented by" event branding, managed from the web admin |

### 5.2 Out of scope for the MVP

| Feature | Why it waits | Planned phase |
| :--- | :--- | :---: |
| New member registration in the app | The website flow already works | 2 |
| In-app donations | Requires Apple nonprofit approval | 2 |
| Scholarship applications | Long form, seasonal use | 2 |
| Gallery | Not essential to the core job | 2 |
| Apple Wallet and Google Wallet passes | Adds certificates and signing work | 2 |
| Tier downgrades | Remains on the website | 2 |
| Member directory | Needs an opt-in first | 3 |
| Chapters, voting and polls | Needs governance decisions | 3 |
| Yoruba lessons, proverbs and widget | Needs reviewed language content | 3 |
| Yoruba language interface | Needs professional translation | 3 |
| Member perks from partner businesses | Needs signed partners first | 2 |
| Sponsored news posts | Needs an editorial policy | 2 |
| Diaspora business directory | Needs enough listings to be useful | 3 |
| Third-party ad networks | Low income at this audience size and a privacy cost (Section 11.1) | Not planned |

---

## 6. Screen Specifications

Screen numbers match the [sample screens](https://claude.ai/artifact/7tP8X8kjenygfpNhLqgvYj).

### 6.1 Getting in and staying informed

#### 01 Welcome
**Purpose:** Introduce the app and establish trust.
- YIF logo, name and motto
- UN/ECOSOC status and registration number IT 28744
- "Sign in" and "Become a member" (opens the website)

#### 02 Sign in
**Purpose:** Let existing members in with their current account.
- Email and password, with clear error messages
- "Forgot password" uses the existing reset email
- Offer fingerprint or Face ID after the first successful sign-in
- Rate-limit repeated failed attempts

#### 03 Home
**Purpose:** Show the member where they stand and what to do next.
- Greeting and notification bell with an unread indicator
- Membership summary that opens the card
- Renewal prompt, shown from 30 days before expiry and after expiry
- Shortcuts to tickets, donations and events
- Next ticketed event, or the next upcoming event if the member has no ticket
- One partner card labelled "Sponsored", or a YIF promotion when no sponsor is booked

#### 04 Notifications
**Purpose:** Keep every message in one place.
- Newest first, with unread items clearly marked
- Tapping an item opens the related screen
- "Mark all as read"

#### 05 Profile
**Purpose:** Let members manage their account.
- Name, tier and location
- Notification preferences, matching the five existing account settings: event invites, newsletter, donation receipts, member updates and scholarship news
- Edit profile, payment history and receipts, help and support
- "Door check-in" appears only for organizers
- Sign out and delete account, with deletion confirmed before it runs

### 6.2 Membership and giving

#### 06 Membership card
**Purpose:** Prove membership anywhere.
- Name, tier, membership number, status, join date and expiry
- Signed QR code (Section 8.4)
- Works with no connection once loaded
- Screen brightness rises while the QR code is showing
- Expired, suspended and pending members see their true status, a disabled QR code and the next step

#### 07 Renew membership
**Purpose:** Renew in under a minute.
- Current tier and expiry date
- Options to renew the current tier or upgrade, with prices from the admin settings
- Currency follows the member's country, and the member can change it
- Opens Paystack (NGN) or Stripe (USD, GBP, EUR) in a secure in-app browser

#### 08 Renewal confirmed
**Purpose:** Confirm the result and update the card.
- New expiry date, payment reference and receipt email
- Shown only after the server confirms payment
- If confirmation is delayed, show "We're confirming your payment" and update automatically

#### 09 Donate
**Purpose:** Let members give without breaking store rules.
- The four existing causes: General Fund, Scholarship Fund, Youth Development, Cultural Programs
- "Continue on yifww.org" opens the phone's browser with the cause already selected

### 6.3 Events, tickets and the door

#### 10 Events
**Purpose:** Help members find events and their tickets.
- Three views: Upcoming, My tickets and Past
- Date, location and starting price on each event

#### 11 Event details
**Purpose:** Give members what they need to decide and buy.
- Image, date, time, venue and description
- Ticket types with prices and remaining availability
- Quantity selector, limited by remaining capacity
- Sold-out and sales-closed states
- "Presented by" line with the sponsor's name and logo, when the event has a presenting sponsor

#### 12 Ticket
**Purpose:** Get the member through the door.
- Event details, ticket type, number admitted and reference
- Signed QR code, saved for offline use
- Add to calendar and get directions

#### 13 Door check-in
**Purpose:** Admit guests quickly and stop duplicate entry.
- Organizers choose their event, and the guest list downloads to the phone
- A clear result for every scan: **Valid**, **Already used**, **Wrong event** or **Not recognized**
- Results use words and icons as well as color
- Live count of guests admitted
- Works offline, and syncs check-ins when the connection returns

### 6.4 News

#### 14 News
**Purpose:** Keep members up to date.
- Published posts, newest first, filtered by topic
- Title, topic, author, date and reading time

#### 15 Article
**Purpose:** Provide a comfortable reading experience.
- Full post, rendered from the website's stored content
- Share through the phone's share sheet, linking to the website
- Recently read articles remain available offline

### 6.5 States every screen must handle

- **Loading:** skeleton placeholders, not blank screens
- **Empty:** a short explanation and a next step
- **Offline:** saved content stays visible, with a notice when data may be out of date
- **Error:** plain language and a retry option

---

## 7. Key Flows & Acceptance Criteria

### 7.1 Renewal

1. The member taps **Renew** and picks a tier.
2. The app asks the server for a checkout link. The server sets the price; the app never sends one.
3. Checkout opens in a secure in-app browser.
4. The payment provider notifies the server by webhook, and the server extends the membership.
5. The browser returns to the app through a verified link, and the app checks the result with the server.

**Acceptance criteria**

- The membership is extended even if the member closes the app during payment.
- A repeated webhook or page reload never extends a membership twice.
- Renewing early adds one full year to the current expiry date.
- A failed or abandoned payment leaves the membership unchanged and offers a retry.
- A receipt email is sent, and the payment appears in payment history.

### 7.2 Ticket purchase

**Acceptance criteria**

- Capacity is held during checkout and released if payment fails or expires.
- Two members cannot buy the last ticket at the same time.
- The ticket appears in the app within 10 seconds of confirmed payment.
- The ticket remains available with no connection after it has loaded once.

### 7.3 Door check-in

**Acceptance criteria**

- A ticket admits only the number of guests it was bought for.
- A ticket that was already used shows the time it was used.
- Scanning works in airplane mode once the guest list has been downloaded.
- Offline check-ins sync automatically without creating duplicates.
- If two offline phones admit the same ticket, the conflict is flagged for the event lead.
- Only organizers assigned to the event can open check-in.

### 7.4 Notifications

| Trigger | Message | Respects preference |
| :--- | :--- | :--- |
| 30, 7 and 1 days before expiry, and on expiry | Renewal reminder | Member updates |
| Payment confirmed | Renewal or ticket confirmation | Always sent |
| 24 hours before a ticketed event | Event reminder | Event invites |
| New event published | Event announcement | Event invites |
| Admin announcement | Announcement | Member updates |

**Acceptance criteria**

- Tapping a notification opens the related screen.
- Members can turn off each category, except payment confirmations.
- The app asks for notification permission after sign-in and explains the benefit first.

---

## 8. Technical Architecture

### 8.1 Mobile stack

| Concern | Choice |
| :--- | :--- |
| Framework | Flutter (stable channel), iOS and Android from one codebase |
| State management | Riverpod |
| Navigation and deep links | go_router, app_links |
| Networking | dio |
| Local database | Drift (SQLite) |
| Secure storage | flutter_secure_storage (session token, keys) |
| Biometrics | local_auth |
| QR display and scanning | qr_flutter, mobile_scanner |
| Push notifications | Firebase Cloud Messaging |
| Checkout | url_launcher with an in-app browser |
| Crash reporting | Sentry |

The app lives in its own repository. The website remains the single backend.

### 8.2 Mobile API

All routes sit under `/api/mobile/v1`, validate input with Zod, and share business logic with the website through `lib/`.

| Method | Route | Purpose |
| :---: | :--- | :--- |
| GET, PATCH | `/me` | Read or update the profile and notification preferences |
| DELETE | `/me` | Delete the account |
| GET | `/membership` | Status, tier, number and expiry |
| GET | `/membership/card` | Signed card QR token |
| GET | `/membership/tiers` | Tiers and prices |
| POST | `/membership/checkout` | Start a renewal or upgrade |
| GET | `/payments` | Payment history |
| GET | `/payments/{reference}` | Status of one payment |
| GET | `/events`, `/events/{slug}` | Event list and details |
| POST | `/events/{slug}/checkout` | Reserve tickets and start payment |
| GET | `/tickets`, `/tickets/{id}` | Tickets with signed QR tokens |
| GET | `/news`, `/news/{slug}` | Published posts |
| GET | `/notifications` | Notification inbox |
| POST | `/notifications/read` | Mark notifications as read |
| POST, DELETE | `/devices` | Register or remove a push token |
| GET | `/organizer/events` | Events assigned to this organizer |
| GET | `/organizer/events/{id}/manifest` | Guest list for offline check-in |
| POST | `/organizer/check-ins` | Upload check-ins in batches |
| GET | `/placements` | Active sponsor placements for a screen or event |
| POST | `/placements/stats` | Upload anonymous view and tap counts |

Sign-in uses the existing Better Auth routes with the bearer plugin enabled.

### 8.3 Database changes

| Change | Purpose |
| :--- | :--- |
| New `DeviceToken` table | Push tokens per user and device |
| New `Notification` table | In-app inbox |
| New `CheckIn` table | Audit trail of who admitted which ticket, when and on which device |
| New `EventOrganizer` table | Assigns organizers to events |
| `Ticket`: add `tierId`, `holderName`, `holderEmail`, `checkedInCount`, `holdExpiresAt`, and make `userId` optional | Link tickets to a tier, allow purchases without an account, hold seats during checkout and track entry |
| `EventTicketTier`: start using `sold` | Enforce capacity. Seats held by checkouts in progress are pending tickets with an unexpired `holdExpiresAt`, not a separate `reserved` counter, so a counter can never drift |
| Door check-in access | Granted by an `EventOrganizer` row for that event (admins also have access), so no new `User.role` value is needed |
| `Transaction`: add `fulfilledAt` | Set in the same database transaction as the membership or ticket change, so a payment is applied exactly once (G1, G4, G5) |
| New `RateLimit` table | Stores sign-in rate limits in the database so they hold across servers |
| Database sequence for membership numbers | Fixes gap G2 |
| New `Sponsor` table | Sponsor name, logo, contact and approval status |
| New `SponsorPlacement` table | What runs, where, and between which dates |
| New `PlacementDailyStat` table | Daily view and tap totals, with no member IDs |

### 8.4 QR code security

- QR codes hold a compact token signed by the server with a private key. The app and scanner hold only the public key.
- Tokens contain IDs and an expiry date. They do not contain names, emails or phone numbers.
- Scanners confirm the signature offline, then look up the guest in the downloaded list.
- Card tokens last no more than 30 days and refresh automatically, so a suspended or expired member's card stops validating.

### 8.5 Security & privacy

- Session tokens are stored only in the device's secure storage.
- Payment details never touch the app. Checkout happens on Paystack's and Stripe's hosted pages.
- Secret keys stay on the server.
- All API routes check the signed-in user and their role on the server.
- Webhooks are verified by signature.
- The privacy policy and data handling must be reviewed against the Nigeria Data Protection Act and, for UK and EU members, UK GDPR and EU GDPR.

---

## 9. Design System

The app uses the website's existing brand tokens so both products feel like one Foundation.

| Token | Value | Use |
| :--- | :--- | :--- |
| Navy Dark | `#111B33` | Primary dark backgrounds |
| Navy | `#1A2744` | Headings, primary buttons |
| Gold Light | `#E8A93E` | Primary action on dark backgrounds |
| Gold | `#C9913D` | Borders and accents on dark backgrounds only |
| Gold Pale | `#F5E6CB` | Highlights and selected states |
| Terracotta (deep) | `#A8452C` | Dates, alerts and warnings |
| Green (deep) | `#235C43` | Success and active status |
| Cream | `#F5F0E8` | Main light background |

**Typography:** Cormorant Garamond for headings and DM Sans for body text. Both must be checked for full Yoruba tone-mark and under-dot support, with a fallback bundled if any character is missing.

**Pattern:** a subtle adire-inspired line pattern on key dark screens.

**Accessibility:** text contrast of at least 4.5:1, touch targets of at least 44 points, support for system text size, and screen reader labels throughout.

**Language:** English for the MVP, with all text stored so Yoruba can be added later.

---

## 10. App Store Requirements

Checked against the Apple App Review Guidelines (updated October 16, 2026) and the Google Play Payments policy. Confirm these again before submission.

| Area | Rule | How the MVP complies |
| :--- | :--- | :--- |
| Event tickets | Apple 3.1.3(e) and Google Play treat real-world services as outside in-app purchase. | Paystack and Stripe hosted checkout |
| Membership dues | The same rules apply when benefits are used in the real world. Paying to unlock features or content inside the app must use in-app purchase (Apple 3.1.1). | **No in-app content or feature is locked behind a paid tier.** Membership is sold for real-world benefits. |
| Donations on iOS | Apple 3.2.2(iv): unless approved as a nonprofit, funds may only be collected outside the app, such as in Safari. | Donate opens the phone's browser |
| Donations on Android | Google Play exempts "tax exempt donations" from Play billing. | Confirm that YIF qualifies before launch |
| Account deletion | Apple 5.1.1(v) requires deletion inside the app. | Delete account in Profile |
| Sign-in | Apple 4.8 applies only if third-party sign-in is added. | MVP uses YIF's own accounts only |
| Sponsored content | Google Play requires apps to declare that they contain ads. Apple requires a tracking permission prompt only if an app tracks people across other companies' apps and websites. | Declare ads on Google Play. Sponsor content is served by YIF with no cross-app tracking. |

Membership dues are the area most open to reviewer interpretation. Prepare a short explanation of the real-world benefits and a demo account for App Review.

---

## 11. Sponsorship & Advertising

### 11.1 Approach

YIF will sell sponsorships directly to vetted businesses instead of using an ad network such as Google AdMob. The audience is too small for network ads to earn meaningful income, but it is valuable to sponsors who want to reach Yoruba professionals and diaspora families.

| Scenario | Monthly app users | Ad views per month | Estimated network income per month |
| :--- | :---: | :---: | :---: |
| 12-month member target (website PRD) | 200 | 4,000 | About $4 |
| Strong growth | 10,000 | 200,000 | About $200 |

*Planning assumptions: 20 ad views per user each month and $1 per 1,000 views. Actual rates vary by country and format.*

Direct sponsorship also keeps control of what members see and avoids sharing member data with advertising companies.

### 11.2 Placements

| Placement | Where it appears | What the sponsor gets | Phase |
| :--- | :--- | :--- | :---: |
| **Event sponsor** | Event details and event reminders | "Presented by" name and logo | MVP |
| **Home partner** | One card on the Home screen | Logo, short message and link, sold by the month or quarter | MVP |
| **Member perks** | A perks section in the app | A discount that members claim by showing their digital card | 2 |
| **Sponsored news** | News feed, no more than one in every six posts | A partner story marked "Sponsored" | 2 |
| **Business directory** | A searchable directory | A paid listing for a Yoruba-owned or aligned business | 3 |

### 11.3 Where sponsors never appear

- Membership card, QR tickets and door check-in
- Sign-in, renewal and payment screens
- Pop-up, full-screen or video formats
- Push notifications that exist only to promote a sponsor, unless the member has opted in

### 11.4 Sponsor standards

Every sponsor must be approved by YIF before anything runs, to protect the Foundation's UN/ECOSOC status and non-partisan charter.

| Welcome | Not accepted |
| :--- | :--- |
| Education and training | Political parties, candidates and campaigns |
| Travel and remittance services from licensed providers | Betting and gambling |
| Professional services | Alcohol and tobacco |
| Food, fashion and cultural businesses | Cryptocurrency promotions |
| Licensed banks and insurers | Quick-loan apps and high-return investment schemes |
| Community and heritage organizations | Adult content and unverified health claims |

### 11.5 Requirements & Acceptance Criteria

**Web admin**

- Admins can add a sponsor, upload a logo, write a short message and set a link.
- Admins can schedule a placement with start and end dates.
- A placement cannot go live until a second admin approves it.
- Admins can stop a placement immediately.
- Admins can download a report of views and taps for each sponsor.

**In the app**

- Every sponsor card is clearly labelled "Sponsored", and event sponsors are labelled "Presented by".
- The Home screen shows no more than one sponsor card at a time.
- When no sponsor is booked, the slot shows a YIF promotion such as the scholarship fund or next event.
- Sponsor links open in the phone's browser.
- A placement that has ended disappears the next time the app connects.
- A slow or failed sponsor image never delays the rest of the screen.

### 11.6 Privacy & Finance

- Sponsors receive total views and taps only. They never receive member names, contact details or individual activity.
- No advertising SDK is included in the app.
- The privacy policy must explain how sponsor content works.
- YIF's accountant should confirm how sponsorship income is treated under its registered nonprofit status before the first contract is signed.

### 11.7 When to Revisit Ad Networks

Reconsider network ads only if the app passes roughly 50,000 monthly users. Even then, limit them to the news feed and apply the same exclusions as Section 11.4.

---

## 12. Implementation Roadmap

This estimate assumes one Flutter developer, one backend developer and part-time design and QA support.

### Phase 0: Backend foundations (Weeks 1-3)
- Fix gaps G1 to G5
- Enable bearer sign-in and build the mobile API
- Apply database changes and set up push notifications

### Phase 1: App core (Weeks 3-6)
- App foundation, design system and sign-in
- Home, membership card, renewal and profile
- News and notifications

### Phase 2: Events, door and sponsors (Weeks 6-10)
- Events, ticket purchase and offline tickets
- Door check-in with offline sync
- Sponsor admin tool, Home partner card and event sponsor branding

### Phase 3: Launch (Weeks 10-13)
- Pilot at one real YIF event
- Testing on low-end Android devices and weak networks
- Security review, store listings and submission
- Phased public release

### After the MVP

| Phase | Features |
| :--- | :--- |
| **Phase 2** | In-app registration, Wallet passes, scholarship applications, gallery, in-app donations (if approved), member perks, sponsored news |
| **Phase 3** | Member directory, chapters, voting, Yoruba lessons and widget, Yoruba interface, diaspora business directory |

---

## 13. Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
| :--- | :---: | :---: | :--- |
| App Review questions membership payments | Medium | High | Keep all benefits real-world and prepare reviewer notes |
| Backend fixes delay the app | Medium | High | Do Phase 0 first, since it also protects website payments |
| Poor connectivity at venues | High | High | Offline tickets, guest lists and check-in |
| Low-end Android performance | Medium | Medium | Test on low-cost devices and keep the app small |
| Low adoption among older members | Medium | Medium | Large text support, simple flows, help at events |
| Duplicate entry from offline scanning | Low | Medium | Assign phones to separate doors and flag conflicts |
| Organization store accounts take time | Medium | Medium | Start Apple and Google enrollment in week 1 |
| An unsuitable sponsor damages YIF's reputation | Low | High | Published standards, two-person approval and an immediate stop control |
| Too few sponsors sign up | Medium | Medium | Start with existing event sponsors and fill empty slots with YIF promotions |
| Members find sponsor content intrusive | Low | Medium | One card per screen, clear labels and no sponsors on critical screens |

---

## 14. Decisions Needed from YIF

| # | Decision | Owner | Needed by |
| :---: | :--- | :--- | :--- |
| 1 | **Logo spelling.** The current logo reads "INIDIGENES". Should it be corrected before it becomes the app icon? | Executive | Before store assets |
| 2 | **Membership prices.** Confirm the live tier prices and what each tier includes. | Executive | Before build |
| 3 | **Official domain.** Confirm yifww.org as the primary domain. Older materials use yifworldwide.org. | Executive | Week 1 |
| 4 | **Store accounts.** Which legal entity will own the Apple and Google developer accounts? Apple requires a D-U-N-S number for organizations. | Admin | Week 1 |
| 5 | **Nonprofit status.** Should YIF apply for Apple's nonprofit program, and does it qualify as tax exempt for Google Play? | Legal | Phase 2 planning |
| 6 | **Organizers.** Who may run door check-in, and who assigns them? | Events lead | Week 6 |
| 7 | **Pilot event.** Which event will be used for the first live test? | Events lead | Week 6 |
| 8 | **Support.** Who answers member questions from the app, and through which channel? | Admin | Before launch |
| 9 | **Sponsor standards.** Approve the accepted and refused categories in Section 11.4, and name the two people who approve sponsors. | Executive | Week 6 |
| 10 | **Sponsor pricing.** Set package prices once the current member count is confirmed. | Executive | Week 8 |
| 11 | **Tax treatment.** Confirm how sponsorship income affects YIF's nonprofit status. | Legal / Finance | Before the first contract |

---

## Appendix A: Sample Screen Data

The sample screens mix real YIF content with illustrative data.

| Real YIF content | Illustrative only |
| :--- | :--- |
| Logo, motto, UN/ECOSOC status, registration number | Member name, number, email and dates |
| Blog posts, authors and dates | The Annual Awards date, venue, time and ticket prices |
| Donation causes | Youth Mentorship Forum |
| Yoruba World Day 2026 details | Check-in counts, payment and ticket references |
| Tier prices (from the content inventory, to be confirmed) | "Sample Partner" and its sponsor message |

The QR codes in the sample screens are not valid credentials.

---

## Appendix B: Glossary

- **MVP:** Minimum Viable Product, the smallest release that delivers real value
- **API:** the connection the app uses to exchange data with the server
- **Webhook:** an automatic message from a payment provider confirming a payment
- **Idempotent:** safe to run more than once without repeating the effect
- **Deep link:** a link that opens a specific screen in the app
- **Push notification:** a message delivered to a phone's notification area
