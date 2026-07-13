// Client-side config for the paid-signup checkout (the letsrecycle promo flow).
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
  letsrecycle: { trialDays: 30 },
};

export const resolvePromo = (
  raw: string | null | undefined,
): { code: string; trialDays: number } | null => {
  const code = (raw ?? "").trim().toLowerCase();
  const promo = PROMOS[code];
  return promo ? { code, ...promo } : null;
};
