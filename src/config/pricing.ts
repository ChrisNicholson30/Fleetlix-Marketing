// Single source of truth for the published price ladder (v2 — see
// Resources/fleetlix-pricing-v2.md). Consumed by:
//   1. src/components/PricingSection.astro — the cards
//   2. src/pages/index.astro — the SoftwareApplication Offer in the JSON-LD
// so the structured data can never advertise a price the page doesn't show.
//
// EVERY figure here EXCLUDES VAT. FLEETLIX LTD is VAT registered, so the site
// must qualify each published amount — the "+VAT" suffix is rendered from this
// fact, not typed per card. Annual is 10x monthly (two months free), which is
// why the saving is derived below rather than stored.
//
// Seats mirror the four roles the app actually assigns — Drivers, Yard,
// Mechanics, Office. The old undefined "Users" pool is retired: it always meant
// Office in practice, and having it sit above three role counts made the card
// arithmetic ambiguous. Admin is a permission flag, not a seat type. Caps are
// enforced in the database, not just the UI.
//
// THE RULE FOR `features`: a bullet may only name capability the APP ACTUALLY
// GATES AT THAT TIER — a real `hasModule`/`moduleAtLeast` branch in the app
// repo's shared/plans matrix. The 2026-08-10 audit (Resources/Pricing v2 — code
// audit.md) found this card had drifted badly: it sold four things that were
// never built, three that are free at every tier, and hid three that are gated
// and saleable. Two failure modes to keep out:
//
//   1. Selling the unbuilt. Anything without code goes in `coming`, never in
//      `features`. `coming` renders muted and dated, so it can't read as included.
//   2. Selling a gate that isn't there. `cart` and `routing` have ZERO call
//      sites — every tier gets the booking widget, the drag-and-drop board, the
//      optimiser and multi-depot views. Those moved to the operations core in
//      PricingSection.astro, which is where ungated capability belongs. Don't
//      move them back onto a tier without a gate landing first.
//
// When a `coming` item ships, move the string into `features` in the same commit
// that lands its gate. Feature bullets are NOT serialised into the homepage
// JSON-LD (only name + price are), so editing them never disturbs the CSP hash.

import type { PlanSlug } from "./checkout";

// "Unlimited" is a real published value at Network, so every capacity number is
// either a count or that literal.
export type Cap = number | "Unlimited";

export interface Tier {
  slug: PlanSlug;
  name: string;
  blurb: string;
  /** Ex-VAT GBP. */
  monthly: number;
  /** Ex-VAT GBP. 10x monthly by policy — two months free. */
  annual: number;
  seats: { drivers: Cap; yard: Cap; mechanics: Cap; office: Cap };
  /** DWTS submissions included per month. */
  dwts: Cap;
  /** The tier whose features this one inherits, for the "Everything in X" line. */
  inherits: string | null;
  /** Only what this tier ADDS on top of `inherits`. Must be gated in the app. */
  features: string[];
  /**
   * Announced but NOT BUILT — no code path exists today. Rendered muted, under
   * a dated "Coming" heading, so it can never be mistaken for included. Empty
   * or absent on tiers that ship everything they advertise.
   */
  coming?: string[];
  icon: string;
  accent: "amber" | "cyan";
  featured?: boolean;
}

/**
 * When everything in a tier's `coming` list is due. One constant so five cards
 * can't quote five dates, and so there is a single line to edit if it slips —
 * a date on a card is a commitment, and a stale one is worse than none.
 */
export const COMING_LABEL = "Coming December 2026";

export const TIERS: Tier[] = [
  {
    slug: "operator",
    name: "Operator",
    blurb: "Sole trader, doing everything yourself.",
    monthly: 99,
    annual: 990,
    seats: { drivers: 2, yard: 1, mechanics: 1, office: 1 },
    dwts: 500,
    inherits: null,
    // The dispatch board is named here deliberately. It is ungated core, but at
    // £99 it is the reason a sole trader buys, and the core panel sits below the
    // cards where a scanning buyer never reaches it. "Register-interest
    // bookings" was removed: it described a cap on the `cart` module that has no
    // gate, so it undersold Operator with a restriction that isn't real.
    features: [
      "Full operations core",
      "Drag-and-drop dispatch board",
      "DWTS compliance submission",
      "Basic invoicing",
    ],
    icon: `<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>`,
    accent: "cyan",
  },
  {
    slug: "workshop",
    name: "Workshop",
    blurb: "Small fleet with a yard and a mechanic.",
    monthly: 219,
    annual: 2190,
    seats: { drivers: 8, yard: 2, mechanics: 3, office: 3 },
    dwts: 2000,
    inherits: "Operator",
    // Four bullets, four gates — this tier is exactly `billing: branded`,
    // `portal: read_only`, `crm: contacts`, `bi: counts`. "Basic online cart"
    // was removed: no basic-vs-paid distinction exists anywhere in the code.
    features: [
      "Branded invoice PDFs",
      "Read-only customer portal",
      "CRM contacts",
      "Basic BI counts",
    ],
    icon: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.6-3.6a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.6 3.6z"/>`,
    accent: "amber",
  },
  {
    slug: "depot",
    name: "Depot",
    blurb: "A full single operation.",
    monthly: 419,
    annual: 4190,
    seats: { drivers: 20, yard: 5, mechanics: 6, office: 8 },
    dwts: 6000,
    inherits: "Workshop",
    // Depot gained more than it lost. Weight pricing and credit accounts are the
    // two most thoroughly gated modules in the app (`weight_pricing`,
    // `commercial_accounts: credit` — nine enforcement sites) and were being
    // given away silently. CRM opportunities moved DOWN from Haulier, where the
    // card had it wrongly: `crm: opportunities` unlocks here.
    //
    // Removed: "Paid online cart" and "Drag-and-drop routing" (neither module is
    // gated at all). Rewritten: "Xero sync (1-way)" — it is a CSV export, not a
    // sync, and one boolean opens BOTH formats here, so QuickBooks was never
    // Haulier-only. Calling it a sync is the kind of word a buyer holds you to.
    features: [
      "Weight & tonnage pricing",
      "Credit accounts & credit limits",
      "Brokerage margin tracking",
      "CRM opportunities & pipeline",
      "Per-role dashboards",
      "Recycling & CO₂ portal",
      "Xero & QuickBooks CSV export",
    ],
    icon: `<path d="M3 21V9l9-5 9 5v12"/><path d="M9 21v-8h6v8"/>`,
    accent: "amber",
    featured: true,
  },
  {
    slug: "haulier",
    name: "Haulier",
    blurb: "The commercial operator.",
    monthly: 675,
    annual: 6750,
    seats: { drivers: 50, yard: 12, mechanics: 12, office: 18 },
    dwts: 15000,
    inherits: "Depot",
    // Portal booking leads because it is the single best-defended claim on the
    // card: gated in the UI and backstopped in SQL, which raises for any plan
    // outside haulier/network. Multi-site accounts replace the two unbuilt
    // bullets — `commercial_accounts: multi_site` is a genuine Haulier unlock
    // (parent → child sites, plus the rate matrix) and was unadvertised.
    //
    // "CRM pipeline & tasks" was half wrong in both directions — the pipeline is
    // Depot's, only tasks are Haulier's — so it undersold Depot and oversold
    // this tier. Map route optimisation left entirely: `optimiseRoute` is called
    // unconditionally, so it is free at every tier and now sits in the core.
    features: [
      "Booking from the portal",
      "Multi-site customer accounts",
      "Per-site, per-waste rate matrix",
      "Custom dashboards",
      "CRM tasks & activities",
    ],
    coming: ["Subcontractor logins & auto-PO", "Two-way Xero & QuickBooks sync"],
    icon: `<path d="M3 6.5h11v8.5H3z"/><path d="M14 9h3.5l3 3v3H14z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>`,
    accent: "cyan",
  },
  {
    slug: "network",
    name: "Network",
    blurb: "Multi-site, multi-depot, audit-ready.",
    monthly: 949,
    annual: 9490,
    seats: {
      drivers: "Unlimited",
      yard: "Unlimited",
      mechanics: "Unlimited",
      office: "Unlimited",
    },
    dwts: "Unlimited",
    inherits: "Haulier",
    // Capacity-led, and honestly so. The audit found ZERO network-only gates in
    // the app beyond `bi: drill_down` — multi-depot routing self-hides below two
    // sites rather than checking the plan, and SSO has no OAuth or SAML path at
    // all. So what this tier actually sells is headroom, and the card now says
    // that instead of listing three things Haulier already has.
    //
    // The two "Unlimited" bullets deliberately restate the capacity block above:
    // when capacity IS the product, it earns the repetition. If a real
    // network-only gate ever lands, lead with it and demote these.
    features: [
      "Unlimited seats across every role",
      "Unlimited DWTS submissions",
      "BI drill-down to source records",
    ],
    coming: ["SSO (Google & Microsoft)"],
    icon: `<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,
    accent: "cyan",
  },
];

/** Two months, by construction — kept derived so it can't drift from the pair. */
export const annualSaving = (t: Tier): number => t.monthly * 12 - t.annual;

/** 1,234 — thousands separated, no decimals (every figure is a whole pound). */
export const gbp = (n: number): string => n.toLocaleString("en-GB");

export const formatCap = (c: Cap): string =>
  c === "Unlimited" ? "Unlimited" : gbp(c);

/** The advertised entry price — "from £99/mo" in meta, hero, and JSON-LD. */
export const ENTRY_MONTHLY = TIERS[0].monthly;
/** Top of the ladder, for "from X to Y" copy. */
export const TOP_MONTHLY = TIERS[TIERS.length - 1].monthly;
