// Marketing-site visibility flags.
//
// While SHOW_PRICING is true: the Pricing section (five fixed plans from
// src/config/pricing.ts — Operator/Workshop/Depot/Haulier/Network), the
// "Pricing" nav link, and the hero's "Prices from £99/month" CTA are all
// rendered. The InterestForm ALWAYS renders regardless of this flag — while
// the product is pre-launch it stays the conversion action, and every pricing
// CTA anchors to it. Stripe checkout links were removed with the old tier
// structure (prices changed, Haulier didn't exist); re-add per-plan links at
// launch rather than resurrecting the stale ones.
//
// While SHOW_CONTACT is false: the Contact CTA section, the "Contact" nav
// link, the header + hero "Book a demo" buttons, and the contact email in
// the site footer are hidden. Legal pages (privacy, cookies) keep their
// data-protection contact details — those are statutory.
//
// /support is NOT gated by this flag and must not become gated. The flag hides
// a sales CTA; /support is the address a paying customer and Stripe both rely
// on — it is the URL registered as the account's support site, printed on every
// Stripe receipt. Hiding it would break receipts already in customers' inboxes.

// While SHOW_BROKERS is true: the Broker Network section on the homepage (below
// the operator pricing cards) and the footer link to /brokers are rendered. The
// /brokers PAGE itself always builds and is always reachable — the flag governs
// discovery, not existence, so a link already shared cannot 404. Broker accounts
// are open: both surfaces link Broker Free to the app's no-card signup. Broker
// Pro starts a checkout directly, except while it is earn-only
// (BROKER_PRO_EARN_ONLY in ./checkout), when its button explains how to earn it.
export const SHOW_BROKERS = true

// Pausing new subscriptions is NOT a flag here. It is SALES_PAUSED in
// ./checkout, because it has a server twin in functions/api/checkout.ts that
// must move with it.

export const SHOW_PRICING = true
export const SHOW_CONTACT = false

// While SHOW_TERM_CONTRACTS is true: the fixed-term picker (TermPicker.astro)
// renders under the plan cards, with every plan on a 24/36/48/60-month term and
// an "Order" link to fleetlix.app/subscribe. OFF until the app side is live —
// migrations 242–246 applied, the solicitor-approved agreement uploaded and the
// billing series switched to live — because the link lands on the app's order
// form. Turning it on does not remove the monthly cards or their checkout; that
// is Open Decision 1 (retiring Stripe subscriptions).
export const SHOW_TERM_CONTRACTS = false
