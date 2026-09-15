// Checkout buttons, progressively enhanced. Two kinds:
//
// 1. OPERATIONS plan CTAs ([data-checkout-cta]) — promo-gated. With no (or an
//    unknown) ?promo= in the URL they stay "Register interest" links exactly as
//    server-rendered. With a valid promo each becomes a "Start N-day free
//    trial" button.
// 2. OPEN plan CTAs — anyone can buy, no code. [data-open-checkout] names its
//    plan in data-plan (Fleetlix Compliance); [data-broker-checkout] is Broker
//    Pro. Server-rendered as links to an enquiry form, so a no-JS visitor still
//    has a route in; with JS they create a Checkout Session directly.
//
// All of them POST /api/checkout and redirect to Stripe.
//
// Imports ./lib/env (the shared chunk) so Astro emits this as an external
// /_astro/*.js file under script-src 'self' — no CSP hash. See public/_headers.
import { BROKER_PRO_SLUG, COMPLIANCE_SLUG, resolvePromo } from "../config/checkout";
import { qsa } from "./lib/env";

const OPEN_SLUGS = new Set<string>([BROKER_PRO_SLUG, COMPLIANCE_SLUG]);

// Wires one CTA to Stripe. The body is built at click time so a billing toggle
// flipped after load is honoured. A CTA is only wired once, because a page can
// load this module more than once (the homepage pricing section and the broker
// teaser both import it).
function wire(cta: HTMLAnchorElement, idleLabel: string, body: () => Record<string, unknown>) {
  if (cta.dataset.wired === "1") return;
  cta.dataset.wired = "1";

  const label = cta.querySelector<HTMLElement>("[data-checkout-label]");
  const setLabel = (text: string) => {
    if (label) label.textContent = text;
  };

  setLabel(idleLabel);

  cta.addEventListener("click", async (event) => {
    event.preventDefault();
    if (cta.dataset.busy === "1") return;
    cta.dataset.busy = "1";
    cta.setAttribute("aria-busy", "true");
    setLabel("Redirecting to secure checkout…");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body()),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (res.ok && data.url) {
        window.location.href = data.url; // → Stripe Checkout
        return;
      }
      setLabel(data.error || "Something went wrong");
    } catch {
      setLabel("Network error — try again");
    }

    // Only reached when we did not navigate away.
    cta.dataset.busy = "0";
    cta.removeAttribute("aria-busy");
    window.setTimeout(() => {
      if (cta.dataset.busy === "0") setLabel(idleLabel);
    }, 2600);
  });
}

// ── Operations plans (promo-gated) ─────────────────────────────────────────
const promo = resolvePromo(
  new URLSearchParams(window.location.search).get("promo"),
);
if (promo) {
  const trialLabel = `Start ${promo.trialDays}-day free trial`;

  // The billing toggle is the same pair of radios global.css reads with :has()
  // to swap the price blocks — no separate state to keep in sync. Read at click
  // time, not on load. Absent radios fall back to monthly, which is what the
  // cards show by default.
  const billingInterval = (): "month" | "year" =>
    document.querySelector<HTMLInputElement>("#billing-annual")?.checked
      ? "year"
      : "month";

  for (const cta of qsa<HTMLAnchorElement>("[data-checkout-cta]")) {
    const plan = cta.dataset.plan;
    if (!plan) continue;
    cta.setAttribute("href", "#pricing"); // no longer jumps to the interest form
    cta.setAttribute("aria-label", `${trialLabel} — ${plan}`);
    wire(cta, trialLabel, () => ({ plan, promo: promo.code, interval: billingInterval() }));
  }
}

// ── Open plans (anyone, no code, monthly) ──────────────────────────────────
for (const cta of qsa<HTMLAnchorElement>("[data-open-checkout], [data-broker-checkout]")) {
  const plan = cta.dataset.plan || BROKER_PRO_SLUG;
  if (!OPEN_SLUGS.has(plan)) continue;
  const idle = cta.querySelector("[data-checkout-label]")?.textContent?.trim() || "Buy now";
  wire(cta, idle, () => ({ plan, interval: "month" }));
}
