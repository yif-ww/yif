# M2 Release Checklist: Backend Foundations

**Branch:** `feat/mobile-api` · **Covers:** payment fixes G1 to G5, mobile sign-in, the read-only mobile API, QR signing

This work changes live payment code and the live database. Nothing here has been run against production. Follow the steps in order, and do the dry run first.

---

## 1. What changes for members and for YIF

| Area | Before | After |
| :--- | :--- | :--- |
| Closing the browser during Paystack payment | The member was charged but not activated | Paystack's webhook activates them (G1) |
| Reloading the payment page | Re-sent the confirmation email each time | Emails go out once |
| Membership numbers | Counted active members, so a number could repeat after someone expired | Taken from a database sequence, never repeated (G2) |
| Renewing before expiry | Remaining days were lost | One year is added to the current expiry date (G3) |
| Ticket records | Never created. The dashboard read payments | A ticket is created for each purchase, with a short reference such as `YIF-TK-8F3K2P` (G4) |
| Event capacity | Not enforced. Events could oversell | Seats are held for 15 minutes during checkout and counted when paid (G5) |
| Renewal confirmation email | None | A receipt email is sent |
| Mobile app | No way to sign in | Bearer sign-in, rate-limited password attempts, and read-only mobile API |

**Behaviour to know about**

- **Late payments are honoured.** If a buyer pays after their 15-minute hold ended and the seats are gone, the ticket is still confirmed and the payment is marked `OVERSOLD` in the notes on that transaction's page in admin. This should be rare (it needs a buyer to take more than 15 minutes at checkout while the event sells out). A future admin view will list these. For now, search the notes when an event is close to selling out, then contact or refund the buyer.
- **Upgrades are unchanged.** A first activation or an upgrade is still one year from the payment date. Only same-tier renewals now add to the current expiry.
- **Sold-out events now say so.** The website's ticket forms show "only N tickets left" or "sold out" instead of taking payment.

---

## 2. Before deploying

1. **Back up the production database.** Take a snapshot or branch in Neon first.
2. **Check ticket capacity values.** Capacity is now enforced. Open each published event in admin and confirm every ticket tier's capacity is the real number of seats, not a placeholder such as 0. (The seed uses 500 and the Yoruba World Day reset uses 3,000.)
3. **Approve the package builds on this machine.** From the website folder run `pnpm approve-builds` and allow the listed packages, so Prisma's commands keep working.

## 3. Deploy

1. **Run the migrations on the production database.** From the website folder, with `DATABASE_URL` pointing at production:
   ```bash
   pnpm prisma migrate deploy
   ```
   Two migrations are applied, both additive:
   - `20261120090000_mobile_api_foundations`: new tables, new ticket and payment columns, and the membership number sequence (which starts after the highest number already issued)
   - `20261120093000_auth_rate_limit`: the sign-in rate limit table
2. **Create the QR signing key.** Run `pnpm qr:keygen`. Add the two lines it prints (`QR_SIGNING_KEY_ID` and `QR_SIGNING_PRIVATE_KEY`) to the hosting dashboard's environment variables. **Back up the private key somewhere safe.** If it is lost, every card and ticket has to be reissued. Never commit it and never put it in the app.
3. **Deploy the code.**
4. **Register the Paystack webhook.** In the Paystack dashboard open Settings, then API Keys & Webhooks, and set the webhook URL to:
   ```
   https://www.yifww.org/api/paystack/webhook
   ```
   Set it for **both** live and test mode. Paystack signs requests with the account's secret key, which the server already has as `PAYSTACK_SECRET_KEY`.
5. **Confirm the Stripe webhook** is still registered and `STRIPE_WEBHOOK_SECRET` is set (no change needed).

## 4. Check it works

Use test mode first, with test keys.

- [ ] **Paystack webhook:** pay for a test membership, close the browser before the confirmation page loads, and check the member is still activated within a minute (admin member list, or the member's dashboard).
- [ ] **Paystack dashboard:** open the webhook log and check the delivery shows `200`.
- [ ] **Reload safety:** reload the confirmation page several times. Only one email arrives.
- [ ] **Renewal:** renew a member who has 20 days left. The new expiry is 385 days away, not 365.
- [ ] **Membership numbers:** activate two new members. Their numbers continue the existing sequence and differ.
- [ ] **Tickets:** buy a ticket. A `Ticket` row exists with status `CONFIRMED`, the tier's `sold` count went up, and the confirmation email shows the event date, time and venue.
- [ ] **Capacity:** set a tier's capacity to 1, then try to buy 2. The form refuses with a clear message.
- [ ] **Stripe:** repeat a membership payment and a ticket purchase in a non-NGN currency.
- [ ] **Donate link:** open `https://www.yifww.org/donate?cause=Scholarship%20Fund`. The Scholarship Fund is preselected.
- [ ] **Mobile API:** sign in with `POST /api/auth/sign-in/email` and read `set-auth-token` from the response headers. Then call `GET /api/mobile/v1/me` with `Authorization: Bearer <token>`.
- [ ] **Signing key:** `GET /api/mobile/v1/keys` returns one key, and `GET /api/mobile/v1/membership/card` for an active member returns a token.

## 5. If something goes wrong

- **Webhook failing:** Paystack retries every few minutes, then hourly, for up to 72 hours, so payments are not lost. Fix the cause and the retries complete them. The server log line starts with `[paystack webhook]`.
- **A payment stays unfulfilled:** the member's page load or the next webhook retry completes it. `Transaction.fulfilledAt` is empty until then.
- **Rolling back the code** is safe. The new tables and columns are unused by the old code. Do not drop them.
- **Sign-in blocked for a real member:** the limit is 5 attempts per minute per IP address and clears itself in a minute.

## 6. Environment variables

| Name | New? | Purpose |
| :--- | :---: | :--- |
| `QR_SIGNING_PRIVATE_KEY` | Yes | Signs membership cards and tickets. Required for `/membership/card`, `/tickets` and `/keys` |
| `QR_SIGNING_KEY_ID` | Yes | Names the key, such as `k1`. Change it when the key is rotated |
| `PAYSTACK_SECRET_KEY` | No | Also verifies the webhook signature |
| `STRIPE_WEBHOOK_SECRET` | No | Unchanged |

## 7. Running the tests

```bash
pnpm test                 # fast rules and QR token tests, no database
pnpm test:integration     # payments, sign-in and the mobile API, against a throwaway database
```

The integration tests insert and change rows, so they need `TEST_DATABASE_URL` pointing at a **local throwaway database** with the migrations applied. They refuse to run against any other host. They never touch production.
