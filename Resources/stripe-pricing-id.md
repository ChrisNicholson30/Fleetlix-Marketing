# Stripe price IDs

Feeds `STRIPE_PRICE_MAP` (and `TEST_STRIPE_PRICE_MAP`) on Cloudflare Pages —
see the checkout table in `CLAUDE.md`.

## Status: the live map is STALE

The ids below charge the **old v1 ladder** (£79 / £189 / £350 / £550 / £899,
VAT-inclusive behaviour). The site now publishes the v2 ladder ex VAT, so a
promo checkout against these ids would **advertise £99 and charge £79**.

**Do not hand out a `?promo=` link until the v2 prices exist and
`STRIPE_PRICE_MAP` is repointed at them.**

| Plan | v1 monthly price id (to archive) |
|---|---|
| Operator | `price_1TXiMOEJrNyzHXg0cUr75hwe` |
| Workshop | `price_1TslAwEJrNyzHXg0gzahGLAY` |
| Depot | `price_1TXiQtEJrNyzHXg06WdnxHjl` |
| Haulier | `price_1Tsl7bEJrNyzHXg0RgJPhVQU` |
| Network | `price_1TY4AiEJrNyzHXg09EQJ1NDq` |

Archive them rather than deleting — existing Stripe objects still reference them.

## v2 prices to create

Ten objects — no one-time onboarding price: that fee is scrapped, replaced by a
self-serve migration tool in the app. `tax_behavior` is **immutable on a Price**,
so set it explicitly at creation: getting it wrong means recreating all ten.

```
currency: 'gbp'
tax_behavior: 'exclusive'
```

| Lookup key | Interval | Unit amount | Price id |
|---|---|---:|---|
| `fleetlix_operator_monthly` | month | 9900 | |
| `fleetlix_operator_annual` | year | 99000 | |
| `fleetlix_workshop_monthly` | month | 21900 | |
| `fleetlix_workshop_annual` | year | 219000 | |
| `fleetlix_depot_monthly` | month | 41900 | |
| `fleetlix_depot_annual` | year | 419000 | |
| `fleetlix_haulier_monthly` | month | 67500 | |
| `fleetlix_haulier_annual` | year | 675000 | |
| `fleetlix_network_monthly` | month | 94900 | |
| `fleetlix_network_annual` | year | 949000 | |

Fill the last column in as they're created, then build the env var.

## Env var shape

`functions/api/checkout.ts` accepts two shapes. The flat one is v1's and still
works, but it can only ever bill monthly — an annual request against it is
rejected with "Annual billing isn't available for that plan yet." Use the
nested form once the annual prices exist:

```json
{
  "operator": { "month": "price_…", "year": "price_…" },
  "workshop": { "month": "price_…", "year": "price_…" },
  "depot":    { "month": "price_…", "year": "price_…" },
  "haulier":  { "month": "price_…", "year": "price_…" },
  "network":  { "month": "price_…", "year": "price_…" }
}
```

There is no one-time price to add — the £499 Network onboarding fee was scrapped
on 9 Aug 2026 in favour of a self-serve migration tool in the app. The app-side
setup-fee webhook (`invoice.paid` where `billing_reason === 'subscription_create'`)
should be removed rather than left wired to a price that no longer exists. Still
**test an annual signup end to end before launch** — that path has never been
exercised.

## What kind of Stripe integration this is

Worth settling, because it decides where Stripe Tax gets turned on.

Signup on fleetlix.com is **neither a Payment Link nor a Pricing Table**. There
is no Stripe-hosted object to configure, and no Stripe.js on the site. The only
Stripe integration is `functions/api/checkout.ts`, which POSTs to
`https://api.stripe.com/v1/checkout/sessions` and redirects to the hosted page
it gets back. (`functions/api/checkout-session.ts` reads the session back for
the welcome screen; it is a GET and changes nothing.)

So the "enable Stripe Tax on the object in the dashboard, no code needed" route
does not apply here — there is no object. Tax is already requested **per
session, in code**: `automatic_tax[enabled]=true` and
`tax_id_collection[enabled]=true`. What is outstanding is everything that
request depends on, and none of it is on this site:

1. **Stripe Tax enabled on the account**, with the UK origin address set.
2. **Prices created with `tax_behavior: 'exclusive'`** — see the table above.
   This is immutable per Price; getting it wrong means recreating all ten.
3. **`STRIPE_PRICE_MAP` repointed** at those ids, and a redeploy.

## Before the first live checkout

1. Enable **Stripe Tax** on the account and set the UK origin address. The
   checkout function sends `automatic_tax[enabled]=true` and
   `tax_id_collection[enabled]=true`; without Stripe Tax enabled, session
   creation fails outright and every CTA returns "Couldn't start checkout."
   (`STRIPE_AUTOMATIC_TAX=off` is the escape hatch, but it means absorbing the
   VAT on every UK sale — it is for unblocking a test, not for going live.)
2. Repoint `STRIPE_PRICE_MAP` at the v2 ids, in the nested shape.
3. Redeploy — Pages env var changes need one.
4. Run one test-mode signup on each interval via `TEST_STRIPE_SECRET_KEY` +
   `TEST_STRIPE_PRICE_MAP`, then remove both to go live. Check the welcome
   screen at the end of each: it should show the plan, the trial end and the
   first charge, carry the amber "Stripe test mode" strip, and put a
   `session_id` on the "Create your login" button. Full runbook in `CLAUDE.md`
   under _Testing the signup flow end to end_.
