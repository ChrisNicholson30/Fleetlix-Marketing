// Do the Marshal prices /marshal shows agree with the Marshal app, which bills them?
//
//   node --experimental-strip-types scripts/check-marshal-prices.ts --app ../Marshal
//
// Compares src/config/marshal.ts with the app's src/shared/pricing.ts: the
// constants, the band list prices, and every band × term × customer-type
// monthly price (2 priced bands × 5 terms × Fleetlix customer or not = 20).
// Exits 1, naming every difference. The app is the source of truth.
//
// NOT WIRED INTO `pnpm build`, for the same reason as check-term-prices.ts.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  BPS_PER_EXTRA_YEAR,
  FLEETLIX_CUSTOMER_DISCOUNT_BPS,
  MARSHAL_BANDS,
  MARSHAL_DEFAULT_TERM,
  MARSHAL_TERMS,
  MAX_TERM_DISCOUNT_BPS,
  marshalContractPence,
  marshalMonthlyPence,
  termDiscountBps,
} from "../src/config/marshal.ts";

const args = process.argv.slice(2);
const i = args.indexOf("--app");
const dir = i >= 0 ? args[i + 1] : undefined;
if (!dir) {
  console.error("Usage: node --experimental-strip-types scripts/check-marshal-prices.ts --app ../Marshal");
  process.exit(2);
}

const app = await import(pathToFileURL(resolve(dir, "src/shared/pricing.ts")).href);
const problems: string[] = [];
const same = (label: string, ours: unknown, theirs: unknown) => {
  if (JSON.stringify(ours) !== JSON.stringify(theirs)) problems.push(`${label}: site ${JSON.stringify(ours)}, app ${JSON.stringify(theirs)}`);
};

same("CONTRACT_TERMS", [...MARSHAL_TERMS], [...app.CONTRACT_TERMS]);
same("DEFAULT_TERM", MARSHAL_DEFAULT_TERM, app.DEFAULT_TERM);
same("BPS_PER_EXTRA_YEAR", BPS_PER_EXTRA_YEAR, app.BPS_PER_EXTRA_YEAR);
same("MAX_TERM_DISCOUNT_BPS", MAX_TERM_DISCOUNT_BPS, app.MAX_TERM_DISCOUNT_BPS);
same("FLEETLIX_CUSTOMER_DISCOUNT_BPS", FLEETLIX_CUSTOMER_DISCOUNT_BPS, app.FLEETLIX_CUSTOMER_DISCOUNT_BPS);
same(
  "BANDS",
  MARSHAL_BANDS.map((b) => [b.id, b.label, b.monthlyPence]),
  app.BANDS.map((b: { id: string; label: string; monthlyPence: number | null }) => [b.id, b.label, b.monthlyPence]),
);

const rows: string[] = [];
for (const band of MARSHAL_BANDS) {
  if (band.monthlyPence === null) continue;
  for (const term of MARSHAL_TERMS) {
    same(`termDiscountBps(${term})`, termDiscountBps(term), app.termDiscountBps(term));
    for (const fleetlix of [false, true]) {
      const q = app.quote(band.id, term, fleetlix);
      const ours = marshalMonthlyPence(band.monthlyPence, term, fleetlix);
      same(`${band.id} ${term}m${fleetlix ? " Fleetlix" : ""} monthly`, ours, q?.monthlyPence);
      same(`${band.id} ${term}m${fleetlix ? " Fleetlix" : ""} contract`, marshalContractPence(band.monthlyPence, term, fleetlix), q?.contractPence);
      rows.push(`${band.id.padEnd(9)} ${String(term).padStart(2)}m ${fleetlix ? "fleetlix" : "standard"}  ${String(ours).padStart(5)}  app ${q?.monthlyPence}`);
    }
  }
}

console.log(rows.join("\n"));
if (problems.length) {
  console.error(`\n${problems.length} difference(s):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} Marshal prices and every constant agree with the app.`);
