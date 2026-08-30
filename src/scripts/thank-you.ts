// The welcome screen's two jobs, both of which can only happen in the browser.
//
// 1. SHOW THE ORDER. Stripe redirects here after payment (success_url =
//    fleetlix.com/thank-you?session_id=cs_…), so the page carries the session
//    id but nothing else — it is statically rendered, so the plan, the trial
//    end and the amount are unknowable at build time. GET /api/checkout-session
//    reads them back from Stripe with the secret key the browser must never
//    hold.
// 2. HAND OFF TO THE APP. The "Create your login" button must carry that same
//    session id to fleetlix.app/onboarding — it is the capability the app uses
//    to confirm the paid session and provision the tenant. Drop it and the
//    buyer can't create their login.
//
// Everything here degrades: with no session id, an unconfigured endpoint, or a
// dead network, the page still reads as a complete, correct thank-you and the
// button still opens the app. Nothing throws in front of someone who has just
// paid.
//
// Imports ./lib/env so Astro emits this as an external /_astro/*.js file under
// script-src 'self' (no CSP hash). See public/_headers.
import { qs } from "./lib/env";
import { TIERS } from "../config/pricing";
import { APP_ORIGIN, ONBOARDING_PATH, DEMO_SUMMARY } from "../config/onboarding";

type Summary = {
  status?: string;
  mode?: string;
  plan?: string | null;
  promo?: string | null;
  interval?: string | null;
  email?: string | null;
  trialEnd?: string | null;
  amount?: number | null;
  currency?: string | null;
};

// Mirrors the app's server-side check, and the one in
// functions/api/checkout-session.ts.
const SESSION_ID = /^cs_[A-Za-z0-9_]+$/;

const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id")?.trim() ?? "";
const validSession = SESSION_ID.test(sessionId);
// ?demo previews the screen with no Stripe call at all. ?demo=<plan> picks
// which tier to preview (?demo=depot), &interval=year shows the annual figure —
// the amounts come from src/config/pricing.ts, so a preview can't quote a price
// the cards don't. Bare ?demo falls back to DEMO_SUMMARY's plan.
const demo = params.has("demo");
const demoPlan = params.get("demo")?.trim().toLowerCase() || DEMO_SUMMARY.plan;
const demoInterval = params.get("interval") === "year" ? "year" : "month";

// British English throughout, same as the rest of the site: "13 September
// 2026", not "September 13, 2026". Fixed locale rather than the reader's,
// because the copy around these values is written in one language.
const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    // Whole pounds when there are no pence, matching the pricing cards.
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);

const planName = (slug: string | null | undefined) =>
  TIERS.find((t) => t.slug === slug)?.name ?? null;

const set = (hook: string, text: string) => {
  const el = qs<HTMLElement>(`[data-order-${hook}]`);
  if (el) el.textContent = text;
};

// The `hidden` ATTRIBUTE, not Tailwind's `hidden` class: these rows carry
// `flex`/`sm:flex` for their laid-out state, and a plain display utility would
// win the cascade against the class. The page's <style> block backs this with
// an explicit [hidden] rule, since the UA stylesheet's own loses to both.
const showRow = (hook: string, show: boolean) => {
  const row = qs<HTMLElement>(`[data-order-row="${hook}"]`);
  if (row) row.hidden = !show;
};

const reveal = (selector: string) => {
  const el = qs<HTMLElement>(selector);
  if (el) el.hidden = false;
};

// ---------------------------------------------------------------- app handoff

const link = qs<HTMLAnchorElement>("[data-open-app]");
// Whatever the page server-rendered (`${APP_ORIGIN}${ONBOARDING_PATH}`), kept
// so the incomplete-session branch can put the button back without
// hardcoding a second copy of the URL.
const APP_FALLBACK = link?.href ?? `${APP_ORIGIN}${ONBOARDING_PATH}`;
if (link && validSession) {
  // Demo mode deliberately does NOT rewrite this — a fabricated session id
  // would be rejected by the app, which looks like a broken handoff rather
  // than a preview.
  link.href = `${APP_ORIGIN}${ONBOARDING_PATH}?session_id=${encodeURIComponent(sessionId)}`;
}

// ------------------------------------------------------------- order summary

const card = qs<HTMLElement>("[data-order]");

const render = (summary: Summary) => {
  if (!card) return;

  if (summary.status && summary.status !== "complete") {
    // An abandoned or expired session. Say so plainly rather than showing an
    // empty card — the buyer needs to know they were not charged.
    //
    // Stripe only redirects here on completion, so this is someone returning to
    // an old link. Undo the handoff: passing an incomplete session to the app
    // gets it rejected, which reads as a broken product rather than as the
    // unfinished checkout it is.
    if (link) link.href = APP_FALLBACK;
    set("state", "This checkout wasn't completed, so nothing has been charged.");
    showRow("state", true);
    showRow("details", false);
    return;
  }

  const name = planName(summary.plan);
  const interval = summary.interval === "year" ? "year" : "month";
  const amount =
    typeof summary.amount === "number" && summary.amount > 0
      ? `${money(summary.amount, summary.currency || "GBP")} + VAT`
      : null;

  showRow("plan", Boolean(name || amount));
  set(
    "plan",
    [name, amount && `${amount} a ${interval}`].filter(Boolean).join(" — ") || "—",
  );

  const trialEnd = summary.trialEnd ? new Date(summary.trialEnd) : null;
  const trialValid = trialEnd && !Number.isNaN(trialEnd.getTime());
  showRow("trial", Boolean(trialValid));
  showRow("charge", Boolean(trialValid && amount));
  if (trialValid) {
    set("trial", `Free until ${DATE.format(trialEnd)}`);
    if (amount) set("charge", `${amount} on ${DATE.format(trialEnd)}`);
  }

  showRow("email", Boolean(summary.email));
  if (summary.email) set("email", summary.email);

  showRow("state", false);
  showRow("details", true);

  // Test-mode runs look identical to real ones otherwise, which is how you end
  // up believing you have taken money you have not.
  if (summary.mode === "test") reveal("[data-testmode]");
};

if (card && demo) {
  card.hidden = false;
  reveal("[data-demo]");
  // trialInDays is relative so the preview never shows a date in the past;
  // it is destructured off rather than passed through, since Summary is the
  // shape /api/checkout-session returns and this isn't one of its fields.
  const { trialInDays, ...sample } = DEMO_SUMMARY;
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + trialInDays);

  // An unknown slug falls back rather than rendering a blank plan row, so a
  // typo'd preview URL is obvious as a wrong plan, not as a broken screen.
  const tier =
    TIERS.find((t) => t.slug === demoPlan) ??
    TIERS.find((t) => t.slug === DEMO_SUMMARY.plan);

  render({
    ...sample,
    plan: tier?.slug ?? null,
    interval: demoInterval,
    // Minor units, matching what Stripe returns. Ex VAT, like the cards.
    amount: tier ? (demoInterval === "year" ? tier.annual : tier.monthly) * 100 : null,
    trialEnd: trialEnd.toISOString(),
  });
} else if (card && validSession) {
  // Reveal the card immediately, in its placeholder state, so the summary
  // doesn't shove the page around when the fetch lands.
  card.hidden = false;

  fetch(`/api/checkout-session?session_id=${encodeURIComponent(sessionId)}`, {
    headers: { accept: "application/json" },
  })
    .then((res) => (res.ok ? (res.json() as Promise<Summary>) : Promise.reject(res.status)))
    .then(render)
    .catch(() => {
      // Includes the 503 the endpoint returns before the Stripe env vars are
      // set. Nothing here is load-bearing — the payment happened, the receipt
      // is in their inbox and the app handoff still works — so drop the card
      // rather than showing an error beside a successful payment.
      card.hidden = true;
    });
}
