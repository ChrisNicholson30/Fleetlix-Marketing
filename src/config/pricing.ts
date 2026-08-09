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
  /** Only what this tier ADDS on top of `inherits`. */
  features: string[];
  icon: string;
  accent: "amber" | "cyan";
  featured?: boolean;
}

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
    features: [
      "Full operations core",
      "DWTS compliance submission",
      "Basic invoicing",
      "Register-interest bookings",
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
    features: [
      "Branded invoice PDFs",
      "Read-only customer portal",
      "Basic online cart",
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
    features: [
      "Paid online cart",
      "Brokerage margin tracking",
      "Drag-and-drop routing",
      "Per-role dashboards",
      "Recycling & CO₂ portal",
      "Xero sync (1-way)",
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
    features: [
      "Map route optimisation",
      "Subcontractor logins + auto-PO",
      "Booking from the portal",
      "Custom dashboards",
      "CRM pipeline & tasks",
      "2-way Xero + QuickBooks",
    ],
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
    features: [
      "Multi-depot routing",
      "BI drill-down",
      "Higher DWTS volume",
      "SSO (Google, Microsoft)",
    ],
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
