# YIF Mobile API Contract

**Version:** 1.2 · **Base path:** `/api/mobile/v1` · **Consumer:** the `yif-mobile` Flutter app
**Scope:** [Member App PRD](YIF%20Member%20App%20PRD.md) Section 8.2 · **Built so far:** milestones M2 to M7 on the server, except sponsor placements (M8) and sending push messages (see section 3)

Each route below is marked **Built** (works today, tested) or **Planned** (a later milestone).

---

## 1. Conventions

### Authentication

Sign-in uses the website's existing Better Auth account, with the `bearer` plugin.

| Step | Request | Result |
| :--- | :--- | :--- |
| Sign in | `POST /api/auth/sign-in/email` with `{ "email", "password" }` | Session token in the `set-auth-token` response header |
| Sign out | `POST /api/auth/sign-out` with the bearer header | Session ends and the token stops working |
| Reset password | `POST /api/auth/request-password-reset` with `{ "email", "redirectTo" }` | Reset email sent |

Every route requires `Authorization: Bearer <token>` unless marked **public**. The app keeps the token only in the phone's secure storage and sends no `Origin` header or cookies.

**Sign-in limits (per IP address, per minute):** sign-in 5, sign-up 5, all other auth routes 120. Password reset requests: 3 per 5 minutes. Going over returns `429`. Limits are stored in the database so they hold across all servers.

**Sessions** last 7 days and renew each time they are used (Better Auth defaults). A member who opens the app at least weekly stays signed in. When the server answers `401`, the app signs out and shows Welcome.

### Requests and responses

- JSON in both directions, field names in `camelCase`.
- Dates are ISO 8601 in UTC, such as `2026-12-12T16:00:00.000Z`.
- Money is `{ "amount": 25000, "currency": "NGN" }`, in whole units (not kobo or cents).
- Lists return `{ "items": [...], "nextCursor": "..." }`. `nextCursor` is `null` on the last page. Pass it back as `?cursor=`. `?limit=` defaults to 20, maximum 50. Cursors are opaque.
- Every body is validated on the server with Zod. Unknown fields in a `PATCH` are rejected.
- Authenticated responses carry `Cache-Control: private, no-store`. Public news may be cached for up to a minute.

### Errors

Every error uses one shape. `message` is safe to show to members. `fields` appears only on validation errors.

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Some details are not valid.", "fields": { "firstName": "Too small" } } }
```

| Status | Code | Meaning |
| :---: | :--- | :--- |
| 400 | `VALIDATION_FAILED` | A field or the JSON body is invalid, or a page marker is malformed |
| 401 | `UNAUTHENTICATED` | The token is missing, expired, tampered with or signed out. The app signs out |
| 403 | `FORBIDDEN` | The account is suspended, or the member lacks the needed assignment |
| 403 | `CARD_INACTIVE` | The membership is expired, pending or suspended, so no card is issued |
| 404 | `NOT_FOUND` | Missing, unpublished, or belonging to another member (the two are not distinguished) |
| 409 | `SOLD_OUT` | Not enough seats remain. The message says how many are left |
| 409 | `SALES_CLOSED` | The event is over, so tickets can no longer be bought |
| 409 | `UPCOMING_TICKETS` | Account deletion refused: the member holds paid tickets for upcoming events and should contact YIF first |
| 422 | `TIER_NOT_AVAILABLE` | The tier or ticket option is unknown, retired, a downgrade, free (claimed on the website), or has no price in that currency |
| 403 | `INVALID_PASSWORD` | Account deletion refused: the password is wrong |
| 429 | `RATE_LIMITED` | Too many requests. See `Retry-After` |
| 500 | `INTERNAL` | Unexpected error. Details are logged on the server only |
| 503 | `QR_SIGNING_UNAVAILABLE` | The server has no QR signing key configured |

### Idempotency

No `Idempotency-Key` header is needed. A repeated checkout call makes a new payment reference, and an unused one simply expires (a ticket hold lasts 15 minutes). Uploading check-ins is idempotent by design: each check-in carries its own ID made on the phone.

---

## 2. Shared objects

```jsonc
// Member
{
  "id": "user id",
  "firstName": "Adebola",
  "lastName": "Balogun",            // may be empty
  "email": "adebola@example.com",
  "image": null,
  "city": "Lagos",
  "country": "Nigeria",
  "currency": "NGN",                // first currency offered, from the country; the member can change it
  "isOrganizer": false,             // true for admins and people assigned to an event
  "membership": null | {
    "status": "ACTIVE",             // ACTIVE | EXPIRED | PENDING | SUSPENDED
    "tierId": "cuid",
    "tierName": "Gold",
    "number": "YIF-2025-0142",      // null until the first payment is confirmed
    "joinedAt": "2025-12-09T09:24:00.000Z",
    "expiresAt": "2026-12-09T09:24:00.000Z"
  }
}
```

`membership.status` is the **effective** status: a membership the database still marks `ACTIVE` is reported as `EXPIRED` once its expiry date has passed.

```jsonc
// Event
{
  "id": "cuid", "slug": "annual-awards-2026",
  "title": "Annual Awards and Order of Odua Ceremony",
  "summary": "Honouring Yoruba leaders",     // tagline, or the first 160 characters of the description
  "description": "Plain text",
  "startsAt": "2026-12-12T16:00:00.000Z",    // see "Event times" below
  "endsAt": null,
  "timeLabel": "5:00 PM",                    // the time as the organizers entered it; show this
  "venue": "33A Bode Thomas Street, Surulere, Lagos",
  "shortLocation": "Surulere, Lagos",
  "isOnline": false,
  "imageUrl": "https://res.cloudinary.com/...", "imageAlt": "Event title",
  "salesOpen": true,                         // false once the event is over, or when no tiers exist
  "capacity": 300,
  "tiers": [{ "id": "cuid", "name": "General Admission", "description": "Ceremony and reception",
              "price": { "amount": 25000, "currency": "NGN" }, "remaining": 154 }],
  "sponsor": null                            // Always null until sponsor placements (M8) are built
}
```

`remaining` is capacity minus confirmed tickets minus seats held by checkouts in progress. Event ticket prices are in NGN only for now.

**Event times.** Events store a date and a separate time of day with no time zone. For events in Nigeria (or with no country) `startsAt` applies the time as Nigerian time (UTC+1). For events elsewhere `startsAt` is the date only, and `timeLabel` carries the time. Display `timeLabel` when present.

```jsonc
// Ticket  (only CONFIRMED and USED tickets are returned)
{
  "id": "cuid", "reference": "YIF-TK-8F3K2P",
  "status": "CONFIRMED",                     // CONFIRMED | USED
  "tierName": "General Admission", "quantity": 1,
  "checkedInCount": 0,
  "holderName": "Adebola Balogun",
  "qrToken": "YIF1.T.<payload>.<signature>", // see section 4
  "event": { "id", "slug", "title", "startsAt", "endsAt", "timeLabel", "venue", "shortLocation", "isOver" }
}

// Payment
{
  "reference": "YIF-RN-7K2M9Q",
  "purpose": "MEMBERSHIP",                   // MEMBERSHIP | TICKET | DONATION | OTHER
  "description": "Gold membership",
  "amount": 10000, "currency": "NGN",
  "status": "SUCCESS",                       // PENDING | SUCCESS | FAILED | ABANDONED | REVERSED
  "createdAt": "2026-11-18T09:24:00.000Z"
}

// Placement  (Planned, M8)
{ "id", "sponsorName", "initials", "logoUrl", "message", "link" }
```

---

## 3. Routes

### Account

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/me` | None | `{ "member": Member, "preferences": Preferences }` | Built |
| PATCH | `/me` | Any of `firstName`, `lastName`, `city`, `country`, `preferences` | Same as `GET /me` | Built |
| DELETE | `/me` | `{ "password" }` | `204`. Ends all sessions and wipes name, email, phone, address, bio and photo. Payment records stay, with their amounts and references but no name or email. Scholarship applications are deleted. The account is locked for good. Refused with `409 UPCOMING_TICKETS` while the member holds paid tickets for upcoming events, and for administrators | Built |

`Preferences` is `{ "eventInvites", "newsletter", "donationReceipts", "memberUpdates", "scholarshipNews" }`, all booleans. Payment confirmations are always sent and are not a setting.

### Membership

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/membership` | None | The `membership` object, or `404` if the account has none | Built |
| GET | `/membership/card` | None | `{ "qrToken": "YIF1.C…", "expiresAt", "membershipNumber" }`, or `403 CARD_INACTIVE` | Built |
| GET | `/membership/tiers` | `?currency=NGN` | `{ "currency", "currencies": ["GBP","NGN","USD"], "tiers": [{ "id", "name", "rank", "isCurrent", "price": Money }] }` | Built |
| POST | `/membership/checkout` | `{ "tierId", "currency" }` | `{ "reference", "provider", "checkoutUrl" }` | Built |

- The card token lasts at most 30 days and never outlives the membership. The app refreshes it whenever it has a connection.
- Tiers lists the member's own tier and higher ones that have a price in the chosen currency. Lower tiers stay on the website.
- At checkout the server sets the price. The app sends only the tier and currency.

### Payments

| Method | Route | Response | Status |
| :---: | :--- | :--- | :---: |
| GET | `/payments` | List of `Payment`, newest first. Only payments linked to the member's account or membership | Built |
| GET | `/payments/{reference}` | `{ "payment", "fulfilled", "membershipExpiresAt", "ticketId", "receiptEmail" }`, or `404` | Built |

`fulfilled` turns true once the payment has been applied (membership extended or ticket confirmed). After checkout the app polls this route every 2 seconds for up to 2 minutes. Payments become fulfilled through the provider's webhook, so this works even if the member closed the browser.

### Events and tickets

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/events` | `?when=upcoming\|past`, cursor | List of `Event`. Upcoming is soonest first, past is latest first. An event counts as upcoming until the end of its last day | Built |
| GET | `/events/{slug}` | None | `Event`, or `404` for unknown and unpublished events | Built |
| POST | `/events/{slug}/checkout` | `{ "tierId", "quantity", "currency"? }` | `{ "reference", "provider", "checkoutUrl", "holdExpiresAt" }` | Built |
| GET | `/tickets` | Cursor | List of `Ticket`, newest purchase first | Built |
| GET | `/tickets/{id}` | None | `Ticket`, or `404` if it belongs to someone else | Built |

**Seat holds.** Starting a checkout creates a `PENDING` ticket that holds its seats for **15 minutes**. Confirmed seats count in `sold`. Seats held by an expired checkout stop counting by themselves, and the tier is locked while seats are counted, so two buyers can never take the last seat. A payment that arrives after its hold ended is still honoured (the buyer has paid) and flagged for YIF to review. Orders are limited to 10 tickets (20 for Yoruba World Day passes).

### News (public)

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/news` | `?topic=<topic slug>`, cursor | List of `{ "slug", "title", "topic", "excerpt", "author", "authorRole", "publishedAt", "readMinutes", "imageUrl", "webUrl" }`, newest first | Built |
| GET | `/news/topics` | None | `{ "topics": [{ "slug", "name" }] }` for the filter chips | Built |
| GET | `/news/{slug}` | None | The summary fields plus `"html"` | Built |

`html` is generated on the server from the editor's content. All text is escaped, only known tags are produced, and links and images must use `http` or `https`, so the app can render it safely.

### Notifications and devices

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/notifications` | Cursor | `{ "items": [{ "id", "kind", "title", "body", "link", "read", "createdAt" }], "nextCursor", "unreadCount" }` | Built |
| POST | `/notifications/read` | `{ "ids": [...] }` or `{ "all": true }` | `204`. IDs that are not the member's are ignored | Built |
| POST | `/devices` | `{ "token", "platform": "ios\|android", "appVersion" }` | `204`. A token belongs to one member at a time | Built |
| DELETE | `/devices` | `{ "token" }` | `204` | Built |

The server already writes inbox rows (`Notification`) when a payment is confirmed. `kind` is `renewal`, `ticket`, `event`, `news` or `announcement`, and `link` is an in-app path such as `/tickets/abc`.

### Door check-in (organizers assigned to the event)

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/organizer/events` | None | `{ "items": [{ "id", "title", "shortTitle", "startsAt", "capacity", "admittedCount" }] }`. Events the person is assigned to; administrators see all | Built |
| GET | `/organizer/events/{id}/manifest` | None | `{ "eventId", "generatedAt", "capacity", "keys": [{ "kid", "publicKey" }], "entries": [{ "ticketId", "holderName", "tierName", "quantity", "checkedInCount", "lastCheckInAt", "lastGate" }] }`. Paid tickets only. An event the person does not run answers `404` | Built |
| POST | `/organizer/check-ins` | `{ "eventId"?, "checkIns": [{ "id": "uuid", "ticketId", "count", "at", "gate", "deviceId" }] }` (up to 200) | `{ "results": [{ "id", "status": "ACCEPTED\|DUPLICATE\|CONFLICT\|REJECTED" }], "admittedCount" }`, results in the order sent | Built |

Each check-in `id` is generated on the phone, so retries never admit a guest twice. `CONFLICT` means two phones admitted more guests than a ticket allows. The server keeps both records and flags the ticket for the event lead.

**How an upload is judged** (per check-in, oldest scan first). The ticket row is locked while it is judged, so two phones uploading at once get the same answers they would one after the other.

| Status | Meaning |
| :--- | :--- |
| `ACCEPTED` | Guests were admitted and counted. A ticket becomes `USED` when everyone is in |
| `DUPLICATE` | That check-in ID was already received. Nothing changes |
| `CONFLICT` | Two phones admitted more guests than the ticket allows. Both records are kept and the count stops at the ticket's quantity |
| `REJECTED` | The ticket is unknown, unpaid, or belongs to an event this person does not run |

### Sponsors

| Method | Route | Request | Response | Status |
| :---: | :--- | :--- | :--- | :---: |
| GET | `/placements` | `?slot=home` or `?eventId=` | `{ "placement": Placement \| null }` | Planned (M8) |
| POST | `/placements/stats` | `{ "stats": [{ "placementId", "date", "views", "taps" }] }` | `204`. Totals only, no member IDs | Planned (M8) |

### Signing keys (public)

| Method | Route | Response | Status |
| :---: | :--- | :--- | :---: |
| GET | `/keys` | `{ "keys": [{ "kid", "publicKey" }] }`. `publicKey` is the raw 32-byte Ed25519 key, base64url | Built |

---

## 4. QR tokens

```
YIF1.<kind>.<payload>.<signature>
```

| Part | Value |
| :--- | :--- |
| `kind` | `T` for a ticket, `C` for a membership card |
| `payload` | Base64url JSON. Tickets: `{ "id", "ev", "exp", "kid" }`. Cards: `{ "id", "exp", "kid" }` |
| `signature` | Base64url Ed25519 signature over the ASCII text `YIF1.<kind>.<payload>` |

- `id` is the ticket ID or the member ID. `ev` is the event ID. `exp` is Unix time in seconds. `kid` names the signing key so keys can be rotated.
- Tokens hold IDs and an expiry only, never names, emails or phone numbers.
- Card tokens last at most 30 days. Ticket tokens expire one day after the event ends.
- The private key stays on the server in `QR_SIGNING_PRIVATE_KEY`. The app fetches public keys from `GET /keys` (and, from M6, in each guest-list manifest) and checks signatures offline.
- A test in the website repo (`tests/integration/mobile-api.test.mts`) rebuilds the public key from its raw bytes and verifies a real card token, the same way the app will.

---

## 5. Payment confirmation (server side)

| Item | Behaviour |
| :--- | :--- |
| Paystack webhook | `POST /api/paystack/webhook`. Verifies the `x-paystack-signature` header, re-checks the payment with Paystack, then fulfils it. Answers `500` on failure so Paystack retries |
| Stripe webhook | `POST /api/stripe/webhook` (existing). Uses the same fulfilment |
| Return pages | `/payment/callback` and `/payment/stripe-callback` use the same fulfilment, so a webhook and a page load can run together safely |
| Exactly once | `Transaction.fulfilledAt` is set in the same database transaction as the membership or ticket change. The first caller does the work; the rest read the result. A failed attempt rolls back and can be retried |
| Membership numbers | Taken from a database sequence (`YIF-<year>-<number>`), so two members never share one. Existing members keep their number |
| Renewal dates | Renewing before expiry adds a year to the **current expiry**. A first activation or an upgrade is one year from the payment date |
| Emails | Welcome (first activation), renewal receipt (renewal or upgrade), ticket and donation emails, each sent once |

## 6. Return links and website changes

| Item | Value | Status |
| :--- | :--- | :---: |
| Checkout return link | Not used. The app opens the hosted payment page in an in-app browser and then asks `GET /payments/{reference}` every 2 seconds until the server has applied the payment, so no return link is needed | Dropped |
| Android verification | `public/.well-known/assetlinks.json` for `org.yifww.members` | Not needed yet (no deep links) |
| iOS verification | `public/.well-known/apple-app-site-association` for `org.yifww.members` | Not needed yet (no deep links) |
| Donate hand-off | `https://www.yifww.org/donate?cause=<cause>`. The form preselects the cause | Built |
