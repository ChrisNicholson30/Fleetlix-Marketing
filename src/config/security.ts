// Content for /security — the Trust & Security document.
//
// This replaces the "App & Data Security" PDF (v1.0, issued 7 August 2026).
// The page IS the document now: one URL to send, no attachment to go stale in
// someone's downloads folder, and a version line that is always the current one.
//
// Editorial rules, inherited from the document and worth keeping:
//   1. Every control described here must be one that actually runs. If a
//      control is partial, the limit goes NEXT TO the control (see §6 and §19),
//      not in a footnote.
//   2. Section 19 — "What we do not claim" — is load-bearing. It is what makes
//      the other eighteen sections credible to someone doing a real technical
//      review. Never quietly drop an item from it because it has become
//      awkward; remove an item only when it stops being true, and say so by
//      bumping DOC.version and DOC.issued.
//   3. Bump DOC.version and DOC.issued whenever the substance changes. The
//      page footer cites both, and the document claims to be reviewed annually.
//
// The tabular content lives here; the prose lives in src/pages/security.astro,
// the same split digital-waste-tracking.astro uses.

export const DOC = {
  version: "1.0",
  issued: "7 August 2026",
  issuedIso: "2026-08-07",
  classification: "Public",
  /** Everything on this page routes here — reports, DPAs, sub-processor notices. */
  contact: "security@fleetlix.com",
} as const;

/* ------------------------------------------------------------------ *
 * At a glance — the four answers most often wanted before anyone
 * reads twenty sections. Each maps to the section that evidences it.
 * ------------------------------------------------------------------ */

export interface Glance {
  label: string;
  headline: string;
  body: string;
  href: string;
  accent: "cyan" | "amber";
  /** Inner paths for a 24x24 stroked icon. */
  icon: string;
}

export const glance: Glance[] = [
  {
    label: "Isolation",
    headline: "Enforced by the database",
    body: "Every table denies by default. One tenant cannot read another's rows even if the client forges its own tenant id.",
    href: "#isolation",
    accent: "cyan",
    icon: `<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  },
  {
    label: "Media",
    headline: "Encrypted per tenant",
    body: "Photos and signatures are stored under a key derived per tenant and held by nobody — not even our hosting provider's dashboard.",
    href: "#at-rest",
    accent: "amber",
    icon: `<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M3 16.5 8 12l3 2.5"/>`,
  },
  {
    label: "Tracking",
    headline: "None",
    body: "No analytics, advertising or session-recording scripts. The app makes no third-party requests a driver did not ask for.",
    href: "#sub-processors",
    accent: "cyan",
    icon: `<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>`,
  },
  {
    label: "Residency",
    headline: "UK and EU",
    body: "Database in the EU, object storage in Western Europe. Statutory waste records do not leave the region.",
    href: "#gdpr",
    accent: "amber",
    icon: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>`,
  },
];

/* ------------------------------------------------------------------ *
 * §4 — Roles. Least-privilege by design: a driver cannot read the
 * customer list because no policy grants it, not because a screen hides it.
 * ------------------------------------------------------------------ */

export interface Role {
  role: string;
  who: string;
  can: string;
}

export const roles: Role[] = [
  {
    role: "Owner",
    who: "The account holder",
    can: "Everything, including billing, plan and other administrators",
  },
  {
    role: "Admin",
    who: "Office management",
    can: "Everything operational; can manage staff but cannot remove the last owner",
  },
  {
    role: "Office",
    who: "Dispatch and back office",
    can: "Jobs, customers, invoices, compliance documents",
  },
  {
    role: "Yard / Weighbridge",
    who: "Gatehouse and yard staff",
    can: "Weighbridge tickets, containers, site checks, load issues",
  },
  {
    role: "Maintenance",
    who: "Workshop",
    can: "Vehicles, work orders, defects, parts",
  },
  {
    role: "Driver",
    who: "Cab and roadside",
    can: "Own run sheet, own walk-around checks, own location",
  },
  {
    role: "Customer portal",
    who: "Your customers",
    can: "Read-only: their own jobs and documents. No pricing, no other accounts",
  },
];

/* ------------------------------------------------------------------ *
 * §14 — Sub-processors. Several are engaged only if the feature that
 * uses them is switched on, which the section's intro says in prose.
 * Keep this list honest and current — §14 promises reasonable notice
 * of a material change, and that promise is only keepable if the list
 * is edited when the architecture is, not afterwards.
 * ------------------------------------------------------------------ */

export interface SubProcessor {
  provider: string;
  purpose: string;
  data: string;
  region: string;
}

export const subProcessors: SubProcessor[] = [
  {
    provider: "Supabase",
    purpose: "Managed PostgreSQL database, authentication, realtime",
    data: "All operational records; account credentials",
    region: "EU",
  },
  {
    provider: "Cloudflare",
    purpose: "Application hosting, edge API, R2 object storage",
    data: "Application traffic; photographs and signatures",
    region: "Western Europe (storage); global edge",
  },
  {
    provider: "Stripe",
    purpose: "Subscription billing, and card payments to the operator",
    data: "Billing contact and payment details. Card data is handled by Stripe, never by Fleetlix",
    region: "EU / US (Stripe DPF)",
  },
  {
    provider: "Anthropic",
    purpose: "Hazardous-waste review assistance (§13)",
    data: "Waste code and operator notes only",
    region: "US",
  },
  {
    provider: "Twilio",
    purpose: "Customer SMS and WhatsApp notifications",
    data: "Recipient number and message body",
    region: "EU / US",
  },
  {
    provider: "Resend",
    purpose: "Transactional and customer email",
    data: "Recipient address and message body",
    region: "EU / US",
  },
  {
    provider: "DEFRA Digital Waste Tracking",
    purpose: "Statutory waste movement reporting",
    data: "Waste movement records, as required by law",
    region: "UK",
  },
  {
    provider: "OpenStreetMap",
    purpose: "Map tile imagery",
    data: "Map viewport requests. No customer records are sent",
    region: "EU",
  },
  {
    provider: "postcodes.io",
    purpose: "UK postcode lookup",
    data: "A postcode. No name or job details are sent",
    region: "UK",
  },
];

/* ------------------------------------------------------------------ *
 * §15 — Categories of personal data held.
 * ------------------------------------------------------------------ */

export interface DataCategory {
  who: string;
  what: string;
}

export const dataCategories: DataCategory[] = [
  {
    who: "Staff",
    what: "Name, work email, role, and — where the feature is used — driving licence and qualification card expiry dates for compliance monitoring.",
  },
  {
    who: "Drivers, additionally",
    what: "Location while a shift is in progress, walk-around check submissions, and signatures captured on site.",
  },
  {
    who: "Your customers",
    what: "Business and contact name, address, telephone, email, and the job history that follows from them.",
  },
  {
    who: "Members of the public receiving a delivery",
    what: "The site address, and a signature and name where they sign for a load.",
  },
];

/* ------------------------------------------------------------------ *
 * §17 — What a reporter can expect, and by when.
 * ------------------------------------------------------------------ */

export interface DisclosureStep {
  stage: string;
  commitment: string;
}

export const disclosure: DisclosureStep[] = [
  { stage: "Acknowledgement", commitment: "Within 2 working days" },
  { stage: "Initial assessment", commitment: "Within 5 working days" },
  {
    stage: "Fix or mitigation",
    commitment: "Prioritised by severity; critical issues are worked immediately",
  },
  {
    stage: "Credit",
    commitment: "We are glad to credit you publicly if you would like us to",
  },
];

/* ------------------------------------------------------------------ *
 * §19 — What we do not claim.
 *
 * The most important list on the page. `lead` is the concession itself;
 * `detail` is the context that stops it reading as a shrug. Anything that
 * moves from this list to a claim elsewhere needs evidence first.
 * ------------------------------------------------------------------ */

export interface NotClaimed {
  lead: string;
  detail: string;
}

export const notClaimed: NotClaimed[] = [
  {
    lead: "We do not hold ISO 27001 or SOC 2.",
    detail:
      "No certification body has audited us. The controls described here are real and verifiable, but they are ours, not an auditor's.",
  },
  {
    lead: "We do not hold Cyber Essentials yet.",
    detail:
      "It is the certification that makes sense for a business our size and it is on the roadmap; we have not put a date on it here because a date we miss is worse than no date.",
  },
  {
    lead: "We have not commissioned an independent penetration test.",
    detail:
      "Security work to date has been architectural, code-level and verified against the live system by our own team.",
  },
  {
    lead: "Media encryption is not end-to-end.",
    detail:
      "See section 6 — we hold the master secret, and we say so.",
  },
  {
    lead: "Multi-factor authentication is not yet available.",
    detail:
      "Sign-in today is email and password with short-lived sessions. MFA is on the roadmap and is the single most requested control we do not have.",
  },
  {
    lead: "Compromised-password screening is not yet switched on.",
    detail:
      "The platform supports it and it is a configuration change, not a build; it is not enabled as at the date of this document.",
  },
  {
    lead: "We do not offer a data processing agreement as a click-through.",
    detail:
      "Ask and we will sign one — it is a conversation, not a form.",
  },
];

/* ------------------------------------------------------------------ *
 * Contents rail. Order and ids must match the sections in
 * src/pages/security.astro — the sticky TOC and the scroll-spy both
 * read this array, so a renamed id fails visibly rather than silently.
 * ------------------------------------------------------------------ */

export interface TocEntry {
  id: string;
  label: string;
}

export const contents: TocEntry[] = [
  { id: "scope", label: "Scope and purpose" },
  { id: "architecture", label: "How Fleetlix is built" },
  { id: "isolation", label: "Tenant isolation" },
  { id: "accounts", label: "Accounts, authentication and roles" },
  { id: "in-transit", label: "Data in transit" },
  { id: "at-rest", label: "Data at rest" },
  { id: "media", label: "Photographs and signatures" },
  { id: "secrets", label: "Credentials and secrets" },
  { id: "audit", label: "Audit trail and record integrity" },
  { id: "availability", label: "Availability, backup and recovery" },
  { id: "device", label: "Data on the device" },
  { id: "location", label: "Driver location and privacy" },
  { id: "ai", label: "Use of artificial intelligence" },
  { id: "sub-processors", label: "Sub-processors" },
  { id: "gdpr", label: "Personal data and UK GDPR" },
  { id: "engineering", label: "How the software is built" },
  { id: "vulnerability", label: "Reporting a vulnerability" },
  { id: "incident", label: "Incident response" },
  { id: "not-claimed", label: "What we do not claim" },
  { id: "contact", label: "Contact" },
];
