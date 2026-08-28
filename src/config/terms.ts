// Contents and key variables for /terms-of-service.
//
// These terms are the contract for the Fleetlix subscription service. They did
// not exist before 28 August 2026 — nothing in this repo carried any
// contractual language at all — so this is the first version and everything in
// it is a deliberate choice rather than an inherited one.
//
// FOUR DECISIONS, taken by Chris on 28 Aug 2026, that the drafting depends on.
// Changing any of them means rewriting more than one section:
//
//   1. Liability is capped at TWELVE MONTHS of fees paid. Section 18.
//   2. Governing law is ENGLAND AND WALES, matching the registered office.
//   3. BUSINESS CUSTOMERS ONLY. Consumers are not eligible, which is what
//      lets the cap and the exclusions in sections 17-18 stand under UCTA
//      1977. If consumers are ever admitted, those sections are unsafe as
//      written and the /support refund section needs revisiting too.
//   4. Acceptance is a REQUIRED TICK BOX at Stripe Checkout
//      (consent_collection[terms_of_service] in functions/api/checkout.ts).
//      Section 2 describes that mechanism, so the two have to agree — if the
//      checkout consent is ever removed, section 2 becomes untrue.
//
// The version and effective date are load-bearing: section 21 says changes
// take effect at your next renewal, which only means anything if the version
// on the page actually moves when the substance does. Bump both together.
//
// NOTE ON SCOPE: this covers the SERVICE (the operations app at fleetlix.app
// and this website). It is not a data processing agreement — /security says a
// DPA is "a conversation, not a form", and section 8 keeps that promise by
// pointing at it rather than pretending to be one.

export const TERMS = {
  version: "1.0",
  effective: "28 August 2026",
  effectiveIso: "2026-08-28",
  /**
   * Aggregate liability cap, in months of fees paid. Referenced from section 18
   * rather than typed into the prose, so the number and the heading cannot
   * disagree. A change here is a change to the commercial risk position — it is
   * not a copy edit.
   */
  liabilityCapMonths: 12,
  governingLaw: "England and Wales",
  courts: "the courts of England and Wales",
} as const;

/* ------------------------------------------------------------------ *
 * Contents. Order and ids must match the sections in
 * src/pages/terms-of-service.astro — the rail, the numbering and the
 * scroll-spy all read this array, and PolicySection derives each
 * number from a section's position in it.
 *
 * CROSS-REFERENCES IN THE PROSE ARE HAND-WRITTEN. Reordering this array
 * renumbers the headings but NOT the "see section 18" mentions in the
 * body. Grep for "section " after any reorder.
 * ------------------------------------------------------------------ */

export interface TocEntry {
  id: string;
  label: string;
}

export const contents: TocEntry[] = [
  { id: "who-we-are", label: "Who we are, what this covers" },
  { id: "agreement", label: "The agreement and who can enter it" },
  { id: "account", label: "Your account and your users" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "service", label: "What we provide" },
  { id: "availability", label: "Availability, changes and support" },
  { id: "compliance", label: "Regulatory compliance stays yours" },
  { id: "your-data", label: "Your data and our role" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "ip", label: "Intellectual property" },
  { id: "fees", label: "Fees, VAT and payment" },
  { id: "trials", label: "Free trials and promotions" },
  { id: "term", label: "Term, renewal and cancellation" },
  { id: "refunds", label: "Refunds" },
  { id: "suspension", label: "Suspension" },
  { id: "third-parties", label: "Third-party services" },
  { id: "warranties", label: "Warranties and disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "termination", label: "Termination and your data" },
  { id: "changes", label: "Changes to these terms" },
  { id: "general", label: "General" },
  { id: "law", label: "Governing law and disputes" },
  { id: "contact", label: "Contact" },
];
