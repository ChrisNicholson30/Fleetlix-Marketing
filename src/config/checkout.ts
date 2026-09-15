// Client-side config for promo-gated paid signup.
// Used by src/scripts/checkout.ts to gate the pricing CTAs to promo holders.
//
// The Cloudflare Pages Function (functions/api/checkout.ts) re-validates the
// promo and plan server-side and is authoritative — it deliberately keeps its
// OWN copy of these values so the payment path has no cross-repo/-boundary
// import. If you add or change a promo or plan slug, update BOTH files.

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

// Broker Pro is the one plan anyone can buy without a code: £249/month + VAT,
// monthly only, no trial. The server copy (functions/api/checkout.ts) finds the
// price by lookup key and checks it before selling. Broker Free is never sold —
// it signs up on the app with no card (BROKER_FREE_SIGNUP_URL).
export const BROKER_PRO_SLUG = "broker_pro";
// Fleetlix Compliance is the other open plan: £49/month + VAT (COMPLIANCE.monthly
// in ./compliance), monthly only, no trial, no code.
export const COMPLIANCE_SLUG = "compliance";
// Operator is the one operations plan anyone can buy: £99/month or £990/year +
// VAT (TIERS in ./pricing), no trial, and promo codes do not apply to it. The
// other four operations plans stay promo-gated.
export const OPERATOR_SLUG = "operator";
/** Plans bought outright with no code. Mirrors OPEN_PLANS in functions/api/checkout.ts. */
export const OPEN_PLAN_SLUGS: readonly string[] = [OPERATOR_SLUG, BROKER_PRO_SLUG, COMPLIANCE_SLUG];
/** £, ex VAT. The server refuses to sell a price that is not exactly this. */
export const BROKER_PRO_MONTHLY = 249;
export const BROKER_FREE_SIGNUP_URL = "https://fleetlix.app/broker/sign-up";

export const resolvePromo = (
  raw: string | null | undefined,
): { code: string; trialDays: number } | null => {
  const code = (raw ?? "").trim().toLowerCase();
  const promo = PROMOS[code];
  return promo ? { code, ...promo } : null;
};
