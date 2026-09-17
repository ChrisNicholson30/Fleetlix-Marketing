// Client-side config for promo-gated paid signup.
// Used by src/scripts/checkout.ts to gate the pricing CTAs to promo holders.
//
// The Cloudflare Pages Function (functions/api/checkout.ts) re-validates the
// promo and plan server-side and is authoritative — it deliberately keeps its
// OWN copy of these values so the payment path has no cross-repo/-boundary
// import. If you add or change a promo or plan slug, update BOTH files.

// ── The sales pause (17 Sep 2026) ──────────────────────────────────────────
// New subscriptions are closed while the payment system is being changed. The
// broker rungs are not closed by the pause: Broker Free signs up on the app and
// never touches checkout, and Broker Pro has its own switch (below). Operator,
// Fleetlix Compliance and the four promo-gated plans take no new subscriptions:
// their buttons render as enquiry links, no promo code is honoured, and the
// pages say why.
//
// This copy only decides what the pages offer. SALES_PAUSED in
// functions/api/checkout.ts is the one that refuses a payment. To reopen, set
// BOTH to false in the same commit.
export const SALES_PAUSED: boolean = true;

// ── Broker Pro is earned, not bought (17 Sep 2026) ─────────────────────────
// While this is on, Broker Pro is not sold anywhere: its buttons point at how to
// earn it through carrier referrals instead of starting a checkout. Separate
// from SALES_PAUSED on purpose, so reopening the other plans leaves Pro
// earn-only until this is switched off too. BROKER_PRO_EARN_ONLY in
// functions/api/checkout.ts is the copy that refuses the payment; move both
// together.
export const BROKER_PRO_EARN_ONLY: boolean = true;

export type PlanSlug =
  | "operator"
  | "workshop"
  | "depot"
  | "haulier"
  | "network";

export const PLAN_SLUGS: PlanSlug[] = [
  "operator",
  "workshop",
  "depot",
  "haulier",
  "network",
];

// Promo codes extend the free trial (they discount *time*, not price). The
// trial length is applied to the Stripe subscription server-side.
export const PROMOS: Record<string, { trialDays: number }> = {
  fleet30: { trialDays: 30 },
  letsrecycle: { trialDays: 14 },
};

export const CARD_PROMO_CODE = "fleet30";

// Broker Pro, when BROKER_PRO_EARN_ONLY is off, is bought without a code:
// £249/month + VAT, monthly only, no trial. The server copy (functions/api/checkout.ts) finds the
// price by lookup key and checks it before selling. Broker Free is never sold —
// it signs up on the app with no card (BROKER_FREE_SIGNUP_URL).
export const BROKER_PRO_SLUG = "broker_pro";
// Fleetlix Compliance is the other open plan: £49/month + VAT (COMPLIANCE.monthly
// in ./compliance), monthly only, no trial, no code.
export const COMPLIANCE_SLUG = "compliance";
// Operator is the one operations plan anyone can buy while sales are open:
// £99/month or £990/year + VAT (TIERS in ./pricing), no trial, and promo codes
// do not apply to it. The other four operations plans stay promo-gated.
export const OPERATOR_SLUG = "operator";
/**
 * Plans bought outright with no code, as things stand. Mirrors OPEN_PLANS in
 * functions/api/checkout.ts, less whatever the two switches above have closed.
 * Pages ask this, not the switches, whether a plan's button is a checkout.
 */
export const OPEN_PLAN_SLUGS: readonly string[] = [
  ...(SALES_PAUSED ? [] : [OPERATOR_SLUG, COMPLIANCE_SLUG]),
  ...(BROKER_PRO_EARN_ONLY ? [] : [BROKER_PRO_SLUG]),
];
/** £, ex VAT. The server refuses to sell a price that is not exactly this. */
export const BROKER_PRO_MONTHLY = 249;
export const BROKER_FREE_SIGNUP_URL = "https://fleetlix.app/broker/sign-up";

// Null for every code while sales are paused: each plan a code applies to is
// closed, so no page may offer a trial and no button may become a trial button.
export const resolvePromo = (
  raw: string | null | undefined,
): { code: string; trialDays: number } | null => {
  if (SALES_PAUSED) return null;
  const code = (raw ?? "").trim().toLowerCase();
  const promo = PROMOS[code];
  return promo ? { code, ...promo } : null;
};
