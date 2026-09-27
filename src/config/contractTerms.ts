// Fixed-term contracts (the Strike term-contracts plan, STK-021): the same five
// plans on a 24, 36, 48 or 60-month term, paid monthly by bank transfer, a
// little cheaper the longer the term.
//
// THE PRICES ARE NOT TYPED HERE. Each is the plan's monthly list price in
// ./pricing.ts with the term's discount applied, rounded half-up to the penny —
// the same rule, to the same penny, as the app's shared/plans/index.ts
// (`termMonthlyPence`), which prices the Order Form and every invoice. That
// file wins any disagreement; `node --experimental-strip-types
// scripts/check-term-prices.ts` compares the two (it is not wired into the build).
//
// The buyer is handed to the app, which owns the order: fleetlix.app/subscribe
// takes `?plan=&term=` and preselects both. A plain link — no script, no
// third-party request, nothing for the CSP to allow.

import type { PlanSlug } from "./checkout";

export const CONTRACT_TERMS = [24, 36, 48, 60] as const;
export type ContractTerm = (typeof CONTRACT_TERMS)[number];

/**
 * Discount off the monthly list price, in basis points (Open Decision 7).
 * 2026-09-27: none on 24 months; 5% on 36, 7.5% on 48, 10% on 60 (was
 * 5 / 10 / 12.5 / 15), matching the app's #394. 24 months is the list price,
 * so nothing on the page may render it as "0% off" or "was £…".
 */
export const TERM_DISCOUNT_BPS: Record<ContractTerm, number> = {
  24: 0,
  36: 500,
  48: 750,
  60: 1000,
};

/** The term preselected on the page. */
export const DEFAULT_TERM: ContractTerm = 36;

export const SUBSCRIBE_URL = "https://fleetlix.app/subscribe";

export const termDiscountPercent = (term: ContractTerm): number => TERM_DISCOUNT_BPS[term] / 100;

/** Monthly price in pence for a list price in whole pounds: half-up to the penny. */
export function termMonthlyPence(listPounds: number, term: ContractTerm): number {
  const list = Math.round(listPounds * 100);
  return Math.floor((list * (10000 - TERM_DISCOUNT_BPS[term]) + 5000) / 10000);
}

export const termContractValuePence = (listPounds: number, term: ContractTerm): number =>
  termMonthlyPence(listPounds, term) * term;

/** "£1,234.56" from pence. */
export const pounds = (pence: number): string =>
  `£${Math.floor(pence / 100).toLocaleString("en-GB")}.${String(pence % 100).padStart(2, "0")}`;

export const subscribeHref = (plan: PlanSlug, term: ContractTerm): string =>
  `${SUBSCRIBE_URL}?plan=${plan}&term=${term}`;
