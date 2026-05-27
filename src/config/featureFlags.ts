// Marketing-site visibility flags. Flip these back to `true` when we're
// ready to take pricing enquiries and inbound contact again.
//
// While SHOW_PRICING is false: the Pricing section, the "Pricing" nav link,
// and the hero's "Monthly £79–Custom" stat are hidden. Stripe checkout
// URLs stay in the source — only the rendered surface area is cut.
//
// While SHOW_CONTACT is false: the Contact CTA section, the "Contact" nav
// link, the header + hero "Book a demo" buttons, and the contact email in
// the site footer are hidden. Legal pages (privacy, cookies) keep their
// data-protection contact details — those are statutory.

export const SHOW_PRICING = false
export const SHOW_CONTACT = false
