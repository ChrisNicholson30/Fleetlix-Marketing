// Promo-gated checkout for the pricing cards. Progressive enhancement: with no
// (or an unknown) ?promo= in the URL, the plan CTAs stay "Register interest"
// links exactly as server-rendered. When a valid promo is present, each CTA
// becomes a "Start N-day free trial" button that creates a Stripe Checkout
// Session (POST /api/checkout) and redirects to Stripe.
//
// Imports ./lib/env (the shared chunk) so Astro emits this as an external
// /_astro/*.js file under script-src 'self' — no CSP hash. See public/_headers.
import { resolvePromo } from "../config/checkout";
import { qsa } from "./lib/env";

const promo = resolvePromo(
  new URLSearchParams(window.location.search).get("promo"),
);
if (promo) {
  const trialLabel = `Start ${promo.trialDays}-day free trial`;

  // The billing toggle is the same pair of radios global.css reads with :has()
  // to swap the price blocks — no separate state to keep in sync. Read at click
  // time, not on load, so a visitor can flip it after the page settles. Absent
  // radios (toggle removed, or an older browser that never rendered it) fall
  // back to monthly, which is what the cards show by default.
  const billingInterval = (): "month" | "year" =>
    document.querySelector<HTMLInputElement>("#billing-annual")?.checked
      ? "year"
      : "month";

  for (const cta of qsa<HTMLAnchorElement>("[data-checkout-cta]")) {
    const plan = cta.dataset.plan;
    if (!plan) continue;

    const label = cta.querySelector<HTMLElement>("[data-checkout-label]");
    const setLabel = (text: string) => {
      if (label) label.textContent = text;
    };

    setLabel(trialLabel);
    cta.setAttribute("href", "#pricing"); // no longer jumps to the interest form
    cta.setAttribute("aria-label", `${trialLabel} — ${plan}`);

    cta.addEventListener("click", async (event) => {
      event.preventDefault();
      if (cta.dataset.busy === "1") return;
      cta.dataset.busy = "1";
      setLabel("Redirecting…");

      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            plan,
            promo: promo.code,
            interval: billingInterval(),
          }),
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
      } finally {
        // Only reset if we didn't navigate away.
        cta.dataset.busy = "0";
        window.setTimeout(() => {
          if (cta.dataset.busy === "0") setLabel(trialLabel);
        }, 2600);
      }
    });
  }
}
