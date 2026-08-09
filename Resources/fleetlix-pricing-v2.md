# Fleetlix Pricing v2 — Launch Spec

#fleetlix #pricing #vat #launch

Supersedes the £79 / £189 / £350 / £550 / £899 ladder. Target: live on the marketing site and in Stripe before **1 October 2026**.

Two things drove the change. First, FLEETLIX LTD is registering for VAT, so every published figure needs a VAT qualifier and every Stripe price needs the right tax behaviour. Second, the old seat caps grew roughly twice as fast as price at every step, which meant no customer above Workshop would ever hit a capacity ceiling — capacity stopped being an upgrade lever and the top tiers advertised a volume discount nobody would claim.

---

## The ladder

All prices **exclude VAT**. Annual is 10× monthly — two months free.

| Tier      | Positioning                            | Monthly  | Annual     | Annual saving |
| --------- | -------------------------------------- | -------- | ---------- | ------------- |
| Operator  | Sole trader, doing everything yourself | £99      | £990       | £198          |
| Workshop  | Small fleet with a yard and a mechanic | £219     | £2,190     | £438          |
| **Depot** | A full single operation                | **£419** | **£4,190** | £838          |
| Haulier   | The commercial operator                | £675     | £6,750     | £1,350        |
| Network   | Multi-site, multi-depot, audit-ready   | £949     | £9,490     | £1,898        |

Depot remains the flagged "most popular" tier.

**No tier carries a one-time fee.** The £499 Network onboarding fee was scrapped
on 9 August 2026 — the replacement is a **self-serve migration tool built into
the app**. Onboarding as a paid service scales with Chris's hours; a migration
tool scales with the product, and it removes the last piece of friction from a
checkout-first funnel where the customer hands over a card before anyone has
spoken to them. The site now advertises "No setup fees" on the back of this, so
reintroducing a fee means changing that claim too.

---

## Seat caps

Drivers is the primary published number. It is the only figure a yard owner can answer without checking, and every step now lands on a recognisable fleet size.

| Tier     | Drivers   | Reads as                   |
| -------- | --------- | -------------------------- |
| Operator | 2         | Owner-driver plus one      |
| Workshop | 8         | Small yard                 |
| Depot    | 20        | Established local operator |
| Haulier  | 50        | Regional                   |
| Network  | Unlimited | Multi-depot                |

### Yard seats

The app runs Yard, Driver, Office and Admin roles, but the pricing card only ever counted drivers and mechanics. Yard staff — weighbridge, loading shovel, gate, yard supervisor — were being absorbed into a generic "Users" pool, which is why that pool had to be so large and so vague.

Adding yard as its own seat type fixes two things at once. It makes the card mirror the roles a tenant actually assigns, and it removes the arithmetic ambiguity that came from an undefined "Users" number sitting above three role counts.

### Proposed full seat matrix

Four named pools, no overlap. **"Users" is retired and replaced by "Office"**, which is what that number always meant in practice.

| Tier     | Drivers   | Yard      | Mechanics | Office    | Total     |
| -------- | --------- | --------- | --------- | --------- | --------- |
| Operator | 2         | 1         | 1         | 1         | 5         |
| Workshop | 8         | 2         | 3         | 3         | 16        |
| Depot    | 20        | 5         | 6         | 8         | 39        |
| Haulier  | 50        | 12        | 12        | 18        | 92        |
| Network  | Unlimited | Unlimited | Unlimited | Unlimited | Unlimited |

Yard headcount scales with sites and throughput rather than with fleet size, which is why it grows more slowly than drivers. A twenty-truck Depot operation typically runs one weighbridge, one or two loading shovel operators and a supervisor across shifts.

**Total is the sum of the four pools, not a separate cap.** Publishing it is optional — it is useful on a comparison table, redundant on a card.

**Admin is a permission flag, not a seat type.** An office or yard user can hold admin rights without consuming a separate seat. Worth stating in the FAQ, because it is the first thing a buyer counting logins will ask.

Caps stay enforced in the database, not just the UI.

---

## Feature gates

Unchanged from the current model. The governing rule, currently buried in the page footer, needs promoting to the top of the pricing section:

> **Depot unlocks each module's core version. Haulier unlocks its power version.**

### Operator

- Full operations core
- DWTS compliance submission
- Basic invoicing
- Register-interest bookings

### Workshop — everything in Operator, plus

- Branded invoice PDFs
- Read-only customer portal
- Basic online cart
- CRM contacts
- Basic BI counts

### Depot — everything in Workshop, plus

- Paid online cart
- Brokerage margin tracking
- Drag-and-drop routing
- Per-role dashboards
- Recycling and CO₂ portal
- Xero sync (one-way)

### Haulier — everything in Depot, plus

- Map route optimisation
- Subcontractor logins and auto-PO
- Booking from the portal
- Custom dashboards
- CRM pipeline and tasks
- Two-way Xero and QuickBooks

### Network — everything in Haulier, plus

- Multi-depot routing
- BI drill-down
- Higher DWTS volume
- SSO (Google, Microsoft)

---

## VAT handling

FLEETLIX LTD is voluntarily VAT registered. CN-DESIGN LTD is not, and runs its own separate threshold test.

### Stripe price objects

Stripe Price objects are **immutable**. `tax_behavior` cannot be changed after creation — if it is wrong, all ten prices have to be recreated. Set it explicitly rather than relying on the account default.

```
tax_behavior: 'exclusive'
currency: 'gbp'
```

Ten new prices — no one-time price object, since the onboarding fee is scrapped:

| Lookup key                    | Interval | Unit amount |
| ----------------------------- | -------- | ----------- |
| `fleetlix_operator_monthly`   | month    | 9900        |
| `fleetlix_operator_annual`    | year     | 99000       |
| `fleetlix_workshop_monthly`   | month    | 21900       |
| `fleetlix_workshop_annual`    | year     | 219000      |
| `fleetlix_depot_monthly`      | month    | 41900       |
| `fleetlix_depot_annual`       | year     | 419000      |
| `fleetlix_haulier_monthly`    | month    | 67500       |
| `fleetlix_haulier_annual`     | year     | 675000      |
| `fleetlix_network_monthly`    | month    | 94900       |
| `fleetlix_network_annual`     | year     | 949000      |

Archive the old prices rather than deleting them — existing Stripe objects still reference them.

### Place of supply

Enable Stripe Tax and collect country plus VAT number at checkout. Self-serve signup means the customer mix is not controllable.

| Customer                        | Treatment                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------ |
| UK business                     | Standard rate 20%                                                              |
| Non-UK business with VAT number | Outside scope, reverse charge, customer accounts                               |
| EU consumer                     | EU VAT from the first sale, no threshold — requires non-Union OSS registration |

The third row is the one to design against. Positioning is UK yard operations and DWTS Scotland compliance, so an EU consumer signup is unlikely, but self-serve card checkout is not a control. Let Stripe Tax make the determination rather than assuming.

### Supplier side

Add the Fleetlix VAT number to every overseas supplier account — Supabase, Cloudflare, GitHub, Apple, AI tooling. Those invoices then arrive without UK VAT and are self-accounted under the reverse charge: same figure into box 1 and box 4, net zero, but it must appear on the return.

Infrastructure spend must bill to the FLEETLIX LTD ANNA account. Anything sitting on a CN-DESIGN card or a personal card is not Fleetlix's input VAT to reclaim.

### Returns

Request **monthly** VAT return periods rather than quarterly. Fleetlix will be in a repayment position from registration until well past launch — monthly returns bring that cash back four times faster. Switch to quarterly once in a payment position.

---

## Setup fee webhook — no longer needed

~~Existing logic fires the one-time fee on `invoice.paid` where `billing_reason === 'subscription_create'`.~~ **Moot as of 9 Aug 2026** — there is no one-time fee on any tier. The path that worried us (a setup fee double-firing or silently skipping on the annual subscription's `invoice.paid`) no longer exists, so it can't fail on day one.

The existing webhook code should be **removed or left permanently dormant**, not simply forgotten: it keys off an event annual signups still raise, so leaving it wired to a price that no longer exists is a latent failure rather than dead code. Whichever way it goes, still run one annual signup end to end before launch — the annual path itself has never been exercised.

---

## Marketing site changes

Astro static site, `fleetlix.com`. **Shipped 9 August 2026.** The ladder now
lives in `src/config/pricing.ts` and is rendered by both `PricingSection.astro`
and the homepage JSON-LD, so the two can't drift.

- [x] Update all five prices
- [x] Add **+VAT** to every figure. (The £499 onboarding fee this originally called out has since been scrapped — the trust row now reads "No setup fees".)
- [x] Add monthly / annual toggle with the annual saving shown per tier — CSS-only (two radios + `:has()`), so no hydration bundle and no CSP hash, and both figures stay in the DOM for crawlers
- [x] Reorder the seat block to lead with **drivers** — then Yard, Mechanics, Office. Total is omitted: it's the sum of four published pools, so printing it on a card is redundant (keep it for a comparison table)
- [x] Move the core / power sentence from the footer to the top of the pricing section
- [x] State the DWTS volume cap on each card — 500 / 2,000 / 6,000 / 15,000 / Unlimited per month, deliberately ~2x realistic usage so a cap is documented but never a mid-contract surprise
- [x] Decide launch CTAs — staying "Register interest" until 1 October; the promo path still upgrades them to "Start 30-day free trial" when `?promo=` is present
- [x] Knock-on copy: hero CTA, `WhyPwa`, `WhoFor`, `StatBand`, meta descriptions, and three FAQ answers (cost, VAT, how seats are counted)
- [x] `functions/api/checkout.ts` takes an `interval` and enables Stripe Tax + VAT-number collection

Not done, and blocking a live promo link: **`STRIPE_PRICE_MAP` still points at
the v1 prices**, so a checkout today would advertise £99 and charge £79. See
`Resources/stripe-pricing-id.md`.

---

## Application changes

- [ ] New Stripe price IDs into the Supabase tier config
- [ ] Seat enforcement updated to the new caps, database-level
- [ ] Annual billing path through checkout
- [ ] VAT number and country capture at signup
- [ ] Setup fee webhook removed (no tier has a one-time fee) — and the annual subscription path exercised end to end
- [ ] **Self-serve migration tool** — the replacement for paid onboarding. Needs to exist before Network is sold, since it's now the whole answer to "how do I get my data in?"

---

## Open questions

**DWTS volume caps.** ~~Needs a figure per tier.~~ **Resolved 9 Aug 2026:** 500 / 2,000 / 6,000 / 15,000 / Unlimited submissions per month, published on each card. Set at roughly twice realistic usage at each tier, so the cap is documented and enforceable without ever being the thing a customer hits in a busy month. Revisit once there is real submission data — if the p95 tenant is nowhere near its ceiling, the caps are doing no commercial work and could tighten.

**Onboarding fee on Haulier.** ~~Worth considering, or dropping.~~ **Closed 9 Aug 2026 — the question is moot: onboarding fees are scrapped entirely**, Network's included, in favour of a self-serve migration tool in the app. The reasoning that killed a Haulier fee (a card is taken before anyone has spoken to the customer, so a surprise line item hits where the funnel is thinnest) applies just as well at Network. Paid onboarding also scales with Chris's hours rather than with the product.

**Driver counts across the real market.** The revised caps assume a meaningful number of prospects sit above 20 trucks. If the honest read from Total Recycling is that most target firms run under 15, then Depot is the practical ceiling for the majority, and Haulier and Network need repositioning around multi-site operation and compliance depth rather than scale.

**Revenue mix.** If most customers land in Workshop or Depot, the blended average lands near £300–£350/month rather than the midpoint of the ladder. That puts the £75k VAT registration forecast at roughly 20–25 paying tenants averaged across the year.

**Grandfathering policy.** No customers exist today, so this is free right now. Worth writing the policy down before it matters — specifically whether early tenants get price protection, and for how long.
