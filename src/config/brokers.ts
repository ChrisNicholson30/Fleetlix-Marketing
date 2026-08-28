// The Broker Network offer — a second, separate price ladder for intermediaries.
//
// Source: Resources/Fleetlix-Broker-Offer.pdf (v0.1 review draft). Publishing it
// here is what makes it real, so the draft markings ("Not yet published",
// "indicative pending publication") are deliberately NOT carried across — a
// public page that calls itself a draft is worse than no page.
//
// WHY THIS IS NOT IN src/config/pricing.ts: brokers are a different product on
// different economics. The five operator tiers are seat-and-module priced and
// all cost money; these two are capacity-priced, one is free forever, and the
// paid rung is normally *earned* rather than bought. Merging them would force
// `Tier` to carry a nullable price and an "earned" state that means nothing to
// the other five. They render from separate configs on purpose.
//
// THREE RULES:
//
//   1. THE ELIGIBILITY LINE IS LOAD-BEARING. Broker Free is for intermediaries
//      only — no owned containers, no owned fleet, no jobs in your own name.
//      Without it, every Operator at £99 reclassifies as a broker and the
//      operator ladder collapses. It is not small print; render it on screen.
//
//   2. NO DWTS DATE IS TYPED HERE. October 2027 is read from
//      DWTS_MILESTONES in ./dwts, which is the single source for every
//      statutory date on this site, and it carries a caveat (the SI had not
//      been laid as of Aug 2026) that the broker page repeats rather than
//      smooths over.
//
//   3. £249 EXCLUDES VAT, like every other published price. FLEETLIX LTD is VAT
//      registered; an unqualified figure is a misquote to a business buyer.
//
// Broker Pro is NOT purchasable at launch — it is earned through referral, and
// £249 is shown as the stated alternative. There is deliberately no Stripe
// plan slug for it: `STRIPE_PRICE_MAP` is still pointed at the stale v1 prices
// (Resources/stripe-pricing-id.md), and adding two more slugs on top of that
// would compound a known blocker. When it does become buyable it needs a price
// created with tax_behavior: 'exclusive' and slugs added to BOTH copies of the
// checkout config.

import { DWTS_MILESTONES } from "./dwts";

/**
 * When brokers can actually sign up. One const, because a date on a public page
 * is a commitment — this is the single line to edit if it slips, the same
 * discipline COMING_LABEL uses in pricing.ts.
 */
export const BROKER_LAUNCH = {
  label: "mid-September 2026",
  /** Modelled point inside the window, for <time datetime>. */
  iso: "2026-09-15",
} as const;

/**
 * The Phase 2 mandate that makes waste tracking a broker problem rather than an
 * operator one. Pulled from the statutory timeline, caveat and all.
 */
export const BROKER_DWTS_MILESTONE = DWTS_MILESTONES.find(
  (m) => m.id === "phase-2-mandatory",
)!;

export type Cell = "yes" | "no";

export interface BrokerTier {
  slug: "broker-free" | "broker-pro";
  name: string;
  /** Headline price as rendered. Free is a real £0, not a trial. */
  price: string;
  /** Sits under the price — the qualifier that stops it being a misquote. */
  priceNote: string;
  blurb: string;
  accent: "cyan" | "amber";
  featured?: boolean;
  limits: { carriers: string; users: string; jobs: string };
  icon: string;
}

export const BROKER_TIERS: BrokerTier[] = [
  {
    slug: "broker-free",
    name: "Broker Free",
    price: "£0",
    priceNote: "No card, no term",
    blurb: "Connects the panel you already have.",
    accent: "cyan",
    limits: { carriers: "5", users: "2", jobs: "150 / month" },
    // Hub and spoke: the broker in the middle, carriers connected around them.
    icon: `<circle cx="12" cy="12" r="2.6"/><circle cx="5" cy="5" r="1.9"/><circle cx="19" cy="5" r="1.9"/><circle cx="5" cy="19" r="1.9"/><circle cx="19" cy="19" r="1.9"/><path d="m6.5 6.5 3.3 3.3M17.5 6.5l-3.3 3.3M6.5 17.5l3.3-3.3M17.5 17.5l-3.3-3.3"/>`,
  },
  {
    slug: "broker-pro",
    name: "Broker Pro",
    price: "Earned",
    priceNote: "or £249/month + VAT",
    blurb: "Grows and defends the panel you want.",
    accent: "amber",
    featured: true,
    limits: { carriers: "Unlimited", users: "10", jobs: "Unlimited" },
    icon: `<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>`,
  },
];

/** The capacity rows, rendered as a comparison table. */
export interface LimitRow {
  label: string;
  free: string;
  pro: string;
}

export const BROKER_LIMITS: LimitRow[] = [
  { label: "Connected carriers", free: "5", pro: "Unlimited" },
  { label: "Users", free: "2", pro: "10" },
  { label: "Jobs passed per month", free: "150", pro: "Unlimited" },
];

export interface FeatureRow {
  label: string;
  free: Cell;
  pro: Cell;
}

/**
 * The rail — everything a broker needs to actually run work through Fleetlix,
 * free forever. This block is the offer: the paid rung adds reach, not
 * function, and a broker on Free is never stuck.
 */
export const BROKER_RAIL: FeatureRow[] = [
  { label: "Pass jobs to your carriers", free: "yes", pro: "yes" },
  { label: "Live job status back from the driver", free: "yes", pro: "yes" },
  { label: "Proof of delivery and waste transfer notes", free: "yes", pro: "yes" },
  { label: "Digital waste tracking submission", free: "yes", pro: "yes" },
  { label: "CSV reconciliation export", free: "yes", pro: "yes" },
];

/** Pro only — growing and defending the panel. */
export const BROKER_PRO_FEATURES: FeatureRow[] = [
  { label: "Carrier discovery by postcode", free: "no", pro: "yes" },
  { label: "Rate matrix — carrier × district × container", free: "no", pro: "yes" },
  { label: "Extras approval with evidence", free: "no", pro: "yes" },
  { label: "Carrier licence expiry monitoring", free: "no", pro: "yes" },
  { label: "Self-billing statements", free: "no", pro: "yes" },
  { label: "Carrier scorecard and margin analytics", free: "no", pro: "yes" },
  { label: "White-label tracking and API", free: "no", pro: "yes" },
];

export interface ReferralStep {
  step: string;
  body: string;
}

/**
 * How Pro is earned. No cash changes hands in either direction — that is the
 * point, not a detail: a cash bounty would put a broker in the position of
 * leaning on a carrier to sign up, which poisons the relationship the whole
 * product depends on.
 */
export const REFERRAL_STEPS: ReferralStep[] = [
  {
    step: "Share your code",
    body: "Every broker account carries a referral code and a share link.",
  },
  {
    step: "They get two months",
    body: "The carrier sees it at signup — two months free on whichever tier suits them.",
  },
  {
    step: "They get going",
    body: "Ten completed jobs in thirty days, at least three of them their own direct work.",
  },
  {
    step: "You get two months",
    body: "Two months of Broker Pro land in your account. Up to twelve months at a time.",
  },
];

export interface ReferralPrinciple {
  lead: string;
  detail: string;
}

export const REFERRAL_PRINCIPLES: ReferralPrinciple[] = [
  {
    lead: "Nothing is ever clawed back.",
    detail: "If the carrier leaves later, you keep the months you earned.",
  },
  {
    lead: "The reward depends on them adopting, not signing.",
    detail:
      "That is why three of the ten jobs must be their own — it is deliberately not enough to just push your own work through them.",
  },
  {
    lead: "When Pro time runs out you drop back to Free, not to nothing.",
    detail: "Your panel and your history stay exactly where they are.",
  },
];

export interface VisibilityRow {
  label: string;
  you: Cell;
  carrier: Cell;
}

/**
 * The margin question, answered as a table because a paragraph would not be
 * believed. Enforced in the data model rather than by policy — which is the
 * only version of this claim worth making.
 */
export const VISIBILITY: VisibilityRow[] = [
  { label: "Price your customer pays", you: "yes", carrier: "no" },
  { label: "Rate you pay the carrier", you: "yes", carrier: "yes" },
  { label: "Your other carriers", you: "yes", carrier: "no" },
  { label: "Your customer list", you: "yes", carrier: "no" },
  { label: "Their other brokers", you: "no", carrier: "yes" },
  { label: "Their direct customers", you: "no", carrier: "yes" },
  { label: "Job status, weights, PoD, transfer notes", you: "yes", carrier: "yes" },
];

/** Rendered under the visibility table — consent, not surveillance. */
export const DISCOVERY_NOTE =
  "Carriers appear in discovery only if they switch it on, choose their own districts and container types, and approve each introduction. Either side can disconnect at any time; past jobs stay readable to both.";

/** The line that keeps the operator ladder intact. Never render this as an aside. */
export const ELIGIBILITY =
  "Broker Free is for intermediaries only — no owned containers, no owned fleet, no jobs run in your own name. Operators who also broker are priced on the standard Fleetlix tiers.";
