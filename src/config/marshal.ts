// Marshal, powered by Fleetlix: prices and order links for /marshal.
//
// Marshal is a separate product with its own sign-in, database and billing. Its
// app is the source of truth for every price here: the Marshal repo's
// src/shared/pricing.ts prices the Order Form and every invoice, and this file
// mirrors it constant for constant. That file wins any disagreement;
// `node --experimental-strip-types scripts/check-marshal-prices.ts --app ../Marshal`
// compares the two (not wired into the build, same as check-term-prices.ts).
//
// DO NOT reuse ./contractTerms.ts for Marshal. Fleetlix contracts run 24 to 60
// months at 0 / 5 / 7.5 / 10% off; Marshal runs 12 to 60 months and takes 2.5%
// off for each year beyond the first.
//
// Rules (from the app):
// - Charged by headcount band, not per user: every member of staff gets a login.
// - Ex-VAT, whole pounds per month, held here in pence.
// - 12 → 0%, 24 → 2.5%, 36 → 5%, 48 → 7.5%, 60 → 10% off the monthly price.
//   12 months is the list price, so nothing on the page may render it as
//   "0% off" or "was £…".
// - Fleetlix customers get a further 15% off, applied AFTER the term discount.
// - Rounding is half-up to the penny in integer basis points, once per step.

/** "£1,234.56" from pence. Same output as contractTerms.ts `pounds`; kept
 * local so the check script can import this file under plain Node. */
export const pounds = (pence: number): string =>
  `£${Math.floor(pence / 100).toLocaleString("en-GB")}.${String(pence % 100).padStart(2, "0")}`;

/**
 * Marshal is not on sale yet. While true, /marshal and the homepage say "Coming soon",
 * prices show as launch prices and every Order button becomes "Register interest"
 * (an email to contact@fleetlix.com). Set false once MARSHAL_APP_URL is live.
 */
export const MARSHAL_COMING_SOON = true;

/** Email link for "tell me when Marshal launches", with the band named when known. */
export const marshalInterestHref = (bandLabel?: string): string =>
  `mailto:contact@fleetlix.com?subject=${encodeURIComponent(`Marshal: tell me when it launches${bandLabel ? ` (${bandLabel.toLowerCase()})` : ""}`)}`;

/** The Marshal app's origin. Its /order route fulfils the Order Form. */
export const MARSHAL_APP_URL = "https://marshal.fleetlix.com";

export const MARSHAL_TERMS = [12, 24, 36, 48, 60] as const;
export type MarshalTerm = (typeof MARSHAL_TERMS)[number];
export const MARSHAL_DEFAULT_TERM: MarshalTerm = 36;

export const BPS_PER_EXTRA_YEAR = 250;
export const MAX_TERM_DISCOUNT_BPS = 1000;
export const FLEETLIX_CUSTOMER_DISCOUNT_BPS = 1500;

export type MarshalBandId = "up_to_50" | "up_to_100" | "up_to_250" | "over_250";

export interface MarshalBand {
  id: MarshalBandId;
  label: string;
  staff: string;
  /** null means quoted per deal. */
  monthlyPence: number | null;
}

export const MARSHAL_BANDS: readonly MarshalBand[] = [
  { id: "up_to_50", label: "Up to 50 staff", staff: "1 to 50", monthlyPence: 25_000 },
  { id: "up_to_100", label: "51 to 100 staff", staff: "51 to 100", monthlyPence: 39_900 },
  { id: "up_to_250", label: "101 to 250 staff", staff: "101 to 250", monthlyPence: 52_000 },
  { id: "over_250", label: "Over 250 staff or groups", staff: "251+", monthlyPence: null },
];

export function termDiscountBps(term: MarshalTerm): number {
  return Math.min(MAX_TERM_DISCOUNT_BPS, (term / 12 - 1) * BPS_PER_EXTRA_YEAR);
}

/** "2.5" from 250 bps. */
export const termDiscountPercent = (term: MarshalTerm): number => termDiscountBps(term) / 100;

/** Apply a discount in basis points to a pence amount, rounding half-up to the penny. */
export function applyBps(pence: number, bps: number): number {
  return Math.floor((pence * (10_000 - bps) + 5_000) / 10_000);
}

/** Monthly price in pence: term discount first, then the Fleetlix-customer discount. */
export function marshalMonthlyPence(listPence: number, term: MarshalTerm, fleetlixCustomer: boolean): number {
  const afterTerm = applyBps(listPence, termDiscountBps(term));
  return fleetlixCustomer ? applyBps(afterTerm, FLEETLIX_CUSTOMER_DISCOUNT_BPS) : afterTerm;
}

export const marshalContractPence = (listPence: number, term: MarshalTerm, fleetlixCustomer: boolean): number =>
  marshalMonthlyPence(listPence, term, fleetlixCustomer) * term;

/** What the term saves against paying the list price for the same number of months. */
export const marshalSavingPence = (listPence: number, term: MarshalTerm, fleetlixCustomer: boolean): number =>
  listPence * term - marshalContractPence(listPence, term, fleetlixCustomer);

/** A plain link to the Marshal app's order form with band and term preselected. */
export const marshalOrderHref = (band: MarshalBandId, term: MarshalTerm, fleetlixCustomer = false): string =>
  `${MARSHAL_APP_URL}/order?band=${band}&term=${term}${fleetlixCustomer ? "&fleetlix=1" : ""}`;
