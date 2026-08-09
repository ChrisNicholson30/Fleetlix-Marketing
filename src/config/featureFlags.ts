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

export const SHOW_PRICING = true
export const SHOW_CONTACT = false
