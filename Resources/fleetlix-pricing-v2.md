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

**Rewritten 10 August 2026** against [[Pricing v2 — code audit]], which read every
`hasModule` / `moduleAtLeast` call site in the app. The list below had been
carried forward unchanged from v1 and was substantially wrong: of 21 published
bullets, 4 described capability that **does not exist**, 4 described capability
**every tier already has**, and 3 gated, saleable modules were **missing
entirely**. The card now prints only what the code gates.

The governing rule was also reworded. It used to read _"Depot unlocks each
module's core version"_, which a buyer can disprove from the same card —
Workshop visibly holds the portal, CRM and BI cores. It is now:

> **Depot unlocks the commercial modules. Haulier unlocks their power versions.**

That is true as stated: `weight_pricing`, `commercial_accounts`, `brokerage` and
`accounting` all start at Depot, and Haulier deepens them.

**The standing rule for this list: a bullet requires a gate.** If the app does
not branch on the plan, the capability is not a tier feature — it either belongs
in the operations core (ungated, everyone gets it) or in _Coming_ (unbuilt).

### Operator

- Full operations core
- **Drag-and-drop dispatch board** — _added._ Ungated core, but at £99 it is the
  reason a sole trader buys and the core panel sits below the cards.
- DWTS compliance submission
- Basic invoicing
- ~~Register-interest bookings~~ — _removed._ Describes a cap on `cart`, which
  has **zero gate call sites**. It undersold Operator with a restriction that
  isn't real.

### Workshop — everything in Operator, plus

- Branded invoice PDFs
- Read-only customer portal
- CRM contacts
- Basic BI counts
- ~~Basic online cart~~ — _removed._ No basic-vs-paid distinction exists in code.

Four bullets, four gates — this tier is now exactly `billing: branded`,
`portal: read_only`, `crm: contacts`, `bi: counts`.

### Depot — everything in Workshop, plus

- **Weight & tonnage pricing** — _added._ `weight_pricing`, enforced, was being
  given away silently.
- **Credit accounts & credit limits** — _added._ `commercial_accounts: credit`.
  Nine enforcement sites, the most thoroughly gated module in the codebase.
- Brokerage margin tracking
- **CRM opportunities & pipeline** — _moved down from Haulier._ `crm:
  opportunities` unlocks here; the card had it a tier too high.
- Per-role dashboards
- Recycling and CO₂ portal
- **Xero & QuickBooks CSV export** — _rewritten_ from "Xero sync (one-way)". It
  is an export, not a sync, and one boolean opens **both** formats at this tier,
  so QuickBooks was never Haulier-only.
- ~~Paid online cart~~, ~~drag-and-drop routing~~ — _removed._ Neither module is
  gated.

### Haulier — everything in Depot, plus

- Booking from the portal — the best-defended claim on the card: gated in the UI
  **and** backstopped in SQL, which raises for any plan outside haulier/network.
- **Multi-site customer accounts** + **per-site, per-waste rate matrix** —
  _added._ `commercial_accounts: multi_site`, a genuine Haulier unlock that was
  unadvertised.
- Custom dashboards
- **CRM tasks & activities** — _corrected_ from "CRM pipeline and tasks", which
  was wrong in both directions: the pipeline is Depot's, only tasks are Haulier's.
- ~~Map route optimisation~~ — _removed._ `optimiseRoute` is called
  unconditionally, so it is free at every tier. Moved to the operations core.

_Coming December 2026:_ subcontractor logins & auto-PO, two-way Xero &
QuickBooks sync. Neither is built — no subcontractor login path, no PO
generation, and the two-way sync needs per-tenant OAuth apps and a token store.

### Network — everything in Haulier, plus

**Capacity-led, by necessity.** The audit found **zero network-only gates** in
the app beyond `bi: drill_down`. Multi-depot routing self-hides below two sites
rather than checking the plan, and `portal: white_label` is already given away
(migration 183 brands the portal at every tier). So headroom is what this tier
actually sells, and the card now says that rather than listing three things
Haulier already has.

- Unlimited seats across every role
- Unlimited DWTS submissions
- BI drill-down to source records
- ~~Multi-depot routing~~ — _removed,_ ungated. Moved to the operations core.
- ~~Higher DWTS volume~~ — _removed_ as a bullet: the capacity block already
  prints "DWTS/mo — Unlimited", which says it better. (No submission counter
  exists anywhere, so **all five published DWTS figures are currently
  unmetered** — an unenforced ceiling, not a broken promise, but see below.)

_Coming December 2026:_ SSO (Google & Microsoft). No OAuth or SAML path exists.

### Moved into the operations core (ungated, every plan)

Migration 078 built a Depot-gated Rounds surface; 079 deleted it as redundant
with the dispatch board, which stayed core for every tier. **The pricing lines
outlived the deletion.** Gating the board now would leave an Operator planning
from a flat job list with no driver lanes — which is not a "full operations
core" — so the card was fixed rather than the code:

- Drag-and-drop dispatch board + live map
- Route optimisation with distance saved
- Multi-depot views once you run two sites
- Online booking requests from your website (`cart` — ungated at every level;
  paid checkout additionally needs the operator to connect Stripe)

The `routing` row in `shared/plans/index.ts` is now dead config that nothing
reads. Either delete it or wire it up — leaving it looks like a gate.

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

**Launch-blocking — the site now publishes these, the app does not yet honour them:**

- [ ] **`PLAN_META` prices are still the v1 ladder** (£79/£189/£350/£550/£899).
      The `/fleetlix` console computes MRR from it, so from the moment v2 sells,
      Fleetlix's own revenue reporting understates every tenant by 20–25%.
- [ ] **Operator's seat caps break the published card.** The site publishes 5
      seats (2 drivers + 1 yard + 1 mechanic + 1 office); `seatLimit` is **3**,
      so the `private.enforce_seat_limit` trigger hard-raises `SEAT_LIMIT` on the
      buyer's 4th login — an over-promise enforced by a raise, on the entry tier,
      at the moment of setup. **Decision 10 Aug 2026: the card is right and the
      database catches up.** Reconcile `PLAN_META` and `set_tenant_plan()` to the
      published matrix in one edit:

      | Tier     | Total | Drivers | Yard | Mechanics | Office |
      | -------- | ----: | ------: | ---: | --------: | -----: |
      | Operator |     5 |       2 |    1 |         1 |      1 |
      | Workshop |    16 |       8 |    2 |         3 |      3 |
      | Depot    |    39 |      20 |    5 |         6 |      8 |
      | Haulier  |    92 |      50 |   12 |        12 |     18 |
      | Network  |     ∞ |       ∞ |    ∞ |         ∞ |      ∞ |

- [ ] **There is no `yard_limit` and no `office_limit` column.** Only
      `seat_limit`, `driver_limit` and `maintenance_limit` exist, so two of the
      four published pools are unenforceable — while the card states "seat limits
      are enforced in the database, not just the UI". Add the two columns with
      the caps above.
- [ ] **Network publishes "Unlimited" five times; the trigger refuses at 500
      users / 400 drivers / 40 mechanics.** No customer will reach 400 drivers,
      but that is not what "Unlimited" means. Raise the caps or make them null.
- [ ] New Stripe price IDs into the Supabase tier config
- [ ] Annual billing path through checkout
- [ ] VAT number and country capture at signup
- [ ] Setup fee webhook removed (no tier has a one-time fee) — and the annual subscription path exercised end to end
- [ ] **Self-serve migration tool** — the replacement for paid onboarding. Needs to exist before Network is sold, since it's now the whole answer to "how do I get my data in?"

**Needed before the December 2026 date on the cards:** subcontractor logins &
auto-PO, two-way Xero/QuickBooks sync, SSO. All three are now printed with a date
against them, so the date is a commitment — if one slips, edit `COMING_LABEL` in
`src/config/pricing.ts` (one constant, all five cards) before it goes stale.

**Not blocking, but worth knowing:**

- **DWTS allowances are unmetered.** `submit_high_volume` has zero call sites and
  no counter exists, so the five published per-month figures are decorative. A
  customer gets *at least* what is advertised, so this under-delivers on
  enforcement rather than on capability — but nothing stops a tenant on Operator
  submitting 50,000.
- **"Change plan anytime" is a Fleetlix-side action.** Since migration 174 a
  tenant admin cannot change their own plan — `set_tenant_plan` is platform-admin
  only. The trust chip is defensible (the plan *can* change on request) but any
  future copy implying instant self-serve upgrade would be wrong until Stripe
  billing lands.
- **The accounting export hard-codes VAT at 20%** and ignores the per-line rates
  migration 182 added, so a mixed-rate invoice exports wrong. The site now names
  that export on the Depot card — worth fixing before a customer reconciles with it.

---

## Open questions

**DWTS volume caps.** ~~Needs a figure per tier.~~ **Resolved 9 Aug 2026:** 500 / 2,000 / 6,000 / 15,000 / Unlimited submissions per month, published on each card. Set at roughly twice realistic usage at each tier, so the cap is documented and enforceable without ever being the thing a customer hits in a busy month. Revisit once there is real submission data — if the p95 tenant is nowhere near its ceiling, the caps are doing no commercial work and could tighten.

**Onboarding fee on Haulier.** ~~Worth considering, or dropping.~~ **Closed 9 Aug 2026 — the question is moot: onboarding fees are scrapped entirely**, Network's included, in favour of a self-serve migration tool in the app. The reasoning that killed a Haulier fee (a card is taken before anyone has spoken to the customer, so a surprise line item hits where the funnel is thinnest) applies just as well at Network. Paid onboarding also scales with Chris's hours rather than with the product.

**Driver counts across the real market.** The revised caps assume a meaningful number of prospects sit above 20 trucks. If the honest read from Total Recycling is that most target firms run under 15, then Depot is the practical ceiling for the majority, and Haulier and Network need repositioning around multi-site operation and compliance depth rather than scale.

**Revenue mix.** If most customers land in Workshop or Depot, the blended average lands near £300–£350/month rather than the midpoint of the ladder. That puts the £75k VAT registration forecast at roughly 20–25 paying tenants averaged across the year.

**Grandfathering policy.** No customers exist today, so this is free right now. Worth writing the policy down before it matters — specifically whether early tenants get price protection, and for how long.
