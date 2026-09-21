// Do the term-contract prices this site shows agree with the app, which bills
// them? (STK-021's parity check.)
//
//   node --experimental-strip-types scripts/check-term-prices.ts --app ../Fleetlix-App
//       compares against a checkout of the app repo (its shared/plans/index.ts)
//   node --experimental-strip-types scripts/check-term-prices.ts --url https://fleetlix.app/api/plans
//       compares against the live price list the app serves
//
// Exits 1, naming every difference, when any of the twenty plan × term prices,
// the list prices or the discounts disagree. The app is the source of truth.
//
// NOT WIRED INTO `pnpm build`: this repo has no test step, and adding one is a
// change to the Pages build that needs agreeing first (CLAUDE.md). Run it before
// changing a price on either side.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { TIERS } from "../src/config/pricing.ts";
import { CONTRACT_TERMS, TERM_DISCOUNT_BPS, termMonthlyPence } from "../src/config/contractTerms.ts";

type Truth = {
  list: Record<string, number>;
  discountBps: Record<number, number>;
  monthlyPence: (plan: string, term: number) => number | null;
};

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function fromApp(dir: string): Promise<Truth> {
  const plans = await import(pathToFileURL(resolve(dir, "shared/plans/index.ts")).href);
  return {
    list: Object.fromEntries(plans.PLANS.map((p: string) => [p, plans.PLAN_META[p].price])),
    discountBps: { ...plans.TERM_DISCOUNT_BPS },
    monthlyPence: (plan, term) => plans.termMonthlyPence(plan, term),
  };
}

async function fromUrl(url: string): Promise<Truth> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  const body = (await res.json()) as {
    contractTerms?: { months: number; discountBps: number }[];
    plans: { key: string; price: number; terms?: { months: number; monthlyPence: number }[] }[];
  };
  if (!body.contractTerms) throw new Error(`${url} does not publish contract terms yet (it needs the app's term-contracts release).`);
  return {
    list: Object.fromEntries(body.plans.map((p) => [p.key, p.price])),
    discountBps: Object.fromEntries(body.contractTerms.map((t) => [t.months, t.discountBps])),
    monthlyPence: (plan, term) =>
      body.plans.find((p) => p.key === plan)?.terms?.find((t) => t.months === term)?.monthlyPence ?? null,
  };
}

const app = flag("--app");
const url = flag("--url");
if (!app && !url) {
  console.error("Pass --app <path to a Fleetlix-App checkout> or --url <…/api/plans>.");
  process.exit(2);
}
const truth = app ? await fromApp(app) : await fromUrl(url!);

const problems: string[] = [];
for (const term of CONTRACT_TERMS) {
  if (truth.discountBps[term] !== TERM_DISCOUNT_BPS[term]) {
    problems.push(`${term} months: this site discounts ${TERM_DISCOUNT_BPS[term]} bps, the app ${truth.discountBps[term]} bps`);
  }
}
for (const tier of TIERS) {
  if (truth.list[tier.slug] !== tier.monthly) {
    problems.push(`${tier.name}: this site lists £${tier.monthly}/month, the app £${truth.list[tier.slug]}`);
  }
  for (const term of CONTRACT_TERMS) {
    const ours = termMonthlyPence(tier.monthly, term);
    const theirs = truth.monthlyPence(tier.slug, term);
    if (ours !== theirs) problems.push(`${tier.name}, ${term} months: this site shows ${ours}p, the app bills ${theirs}p`);
  }
}

const checked = TIERS.length * CONTRACT_TERMS.length;
if (problems.length) {
  console.error(`Term prices DISAGREE with ${app ? app : url}:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`All ${checked} plan × term prices, ${TIERS.length} list prices and ${CONTRACT_TERMS.length} discounts agree with ${app ? app : url}.`);
