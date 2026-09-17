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
// SIGNUP IS OPEN (15 Sep 2026), down two different doors on purpose:
//
//   - BROKER FREE signs up on the app (BROKER_FREE_SIGNUP_URL) with no card and
//     no Stripe object. A £0 checkout would ask for a card the offer promises
//     is never taken.
//   - BROKER PRO is bought through the marketing checkout at £249/month + VAT,
//     no trial, monthly only (plan slug `broker_pro`). Its price is found by
//     LOOKUP KEY, not through `STRIPE_PRICE_MAP`, so the stale v1 map
//     (Resources/stripe-pricing-id.md) is not in its path. Earning Pro through
//     referral is unchanged and still the headline.
//
// BROKER PRO IS EARN-ONLY (17 Sep 2026) while BROKER_PRO_EARN_ONLY in ./checkout
// is on. Nothing sells it: the card leads with "Earned", keeps £249 + VAT as
// what it is worth, and its button explains how to earn it. Broker Free is
// unchanged.

import { DWTS_MILESTONES } from "./dwts";
import {
  BROKER_FREE_SIGNUP_URL,
  BROKER_PRO_MONTHLY,
  BROKER_PRO_SLUG,
  OPEN_PLAN_SLUGS,
} from "./checkout";

/**
 * Whether Broker Pro can be bought right now. False while BROKER_PRO_EARN_ONLY
 * (./checkout) is on, and every Pro surface reads this rather than the switch.
 */
export const BROKER_PRO_OPEN = OPEN_PLAN_SLUGS.includes(BROKER_PRO_SLUG);

/**
 * When broker accounts opened. Kept because <time datetime> reads it; the copy
 * now says "open", not "opens".
 */
export const BROKER_LAUNCH = {
  label: "15 September 2026",
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
  /** The pill on the featured card. */
  badge?: string;
  limits: { carriers: string; users: string; jobs: string };
  icon: string;
  /**
   * The way in. `checkout: true` renders a [data-broker-checkout] button that
   * src/scripts/checkout.ts turns into a Stripe Checkout; its `href` is the
   * no-JS fallback. Otherwise `href` is followed as a plain link.
   */
  cta: { label: string; href: string; note: string; checkout?: boolean };
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
    cta: {
      label: "Start free",
      href: BROKER_FREE_SIGNUP_URL,
      note: "Create your account on Fleetlix. No card, nothing to cancel.",
    },
    // Hub and spoke: the broker in the middle, carriers connected around them.
    icon: `<circle cx="12" cy="12" r="2.6"/><circle cx="5" cy="5" r="1.9"/><circle cx="19" cy="5" r="1.9"/><circle cx="5" cy="19" r="1.9"/><circle cx="19" cy="19" r="1.9"/><path d="m6.5 6.5 3.3 3.3M17.5 6.5l-3.3 3.3M6.5 17.5l3.3-3.3M17.5 17.5l-3.3-3.3"/>`,
  },
  {
    slug: "broker-pro",
    name: "Broker Pro",
    // While Pro is earn-only the headline is how you get it, not a price
    // nobody can pay. The £249 stays, with its + VAT, as what it is worth.
    price: BROKER_PRO_OPEN ? `£${BROKER_PRO_MONTHLY}` : "Earned",
    priceNote: BROKER_PRO_OPEN
      ? "a month + VAT — or earn it by introducing carriers"
      : `Worth £${BROKER_PRO_MONTHLY} a month + VAT. Not sold: you earn it by introducing carriers.`,
    blurb: "Grows and defends the panel you want.",
    accent: "amber",
    featured: true,
    badge: BROKER_PRO_OPEN ? "Earn it, or buy it" : "Earned, not bought",
    limits: { carriers: "Unlimited", users: "10", jobs: "Unlimited" },
    cta: BROKER_PRO_OPEN
      ? {
          label: "Buy Broker Pro",
          // No-JS fallback: the enquiry form at the foot of /brokers.
          href: "#broker-interest",
          // The second sentence is load-bearing until the app has an in-app
          // upgrade: a Free broker buying here would be charged, then refused at
          // onboarding because their email already has an account.
          note: "Billed monthly, no trial, cancel any time. Already on Broker Free? Email us to upgrade.",
          checkout: true,
        }
      : {
          label: "How to earn Pro",
          // #earn-pro is the "Earning Broker Pro" section on /brokers. Written
          // with the path so the homepage teaser can use it as it stands.
          href: "/brokers#earn-pro",
          note: "Start on Broker Free and introduce carriers. No card, and no cash changes hands.",
        },
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
