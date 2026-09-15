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
// are open: both surfaces link Broker Free to the app's no-card signup and start
// a Broker Pro checkout directly.
export const SHOW_BROKERS = true

export const SHOW_PRICING = true
export const SHOW_CONTACT = false
