# Fleetlix Marketing — Session Handoff (13 Jul 2026)

All committed work is pushed to `main`. Cloudflare Pages auto-deploys `main`.

---

## ✅ Completed & live

- **Company entity → FLEETLIX LTD.** Footer, sitewide Organization JSON-LD,
  privacy policy (operator + data controller), FAQ, and the interest-form
  confirmation email all reflect FLEETLIX LTD (co. 17331348, England & Wales,
  66 Paul Street, London). All CN-DESIGN references removed except the
  `chris@cn-design.co.uk` mailbox that Email Routing actually forwards to.
  LICENSE reassigned to FLEETLIX LTD.
- **/card digital business card** + `/fleetlix.vcf` (Add-to-contacts) +
  `public/fleetlix-card-qr.svg` (print QR → `fleetlix.com/card`). Card now
  **leads with the promo** (letsrecycle, 30-day trial) and its CTA points at
  `/?promo=letsrecycle#pricing`. Page is `noindex`, excluded from sitemap.
- **CSP durable fix.** The two project inline scripts (cinematic + mobile-menu)
  are now external `/_astro/*.js` under `script-src 'self'` (they import the
  shared `src/scripts/lib/env.ts`, which Rollup code-splits). `_headers` now
  has **4 stable hashes** only. A Cloudflare esbuild bump had silently broken
  CSP mid-session (blank homepage); this makes that class of failure impossible.
  **Don't reinline those scripts.** See [[csp-hash-local-vs-cloudflare]] memory.
- **Docker / Mac Mini.** Production `Dockerfile` (nginx) + `docker-compose.dev.yml`
  (dev + `marketing-prod` profile) + Mac Mini deploy via SSH docker context.
  `astro.config.mjs` opens the dev server to LAN / OrbStack / Tailscale.
- **Pricing:** monthly-only (yearly scrapped); **white-label portal removed**
  from the Network plan (and `Resources/Pricing.md`).
- **Hero headline** spacing fix ("driverfrom" → "driver from").

## 🟡 In progress — marketing checkout (the active blocker)

**Checkout-first paid signup**, gated to promo-code holders. Built this repo's
half: `functions/api/checkout.ts` (creates a Stripe Checkout Session,
`trial_period_days` from promo, promo-gated 403, self-contained + fully
guarded), `src/scripts/checkout.ts` (enhances pricing CTAs when `?promo=` is
valid), `src/config/checkout.ts`, PricingSection wiring. Supports a
`TEST_STRIPE_SECRET_KEY` / `TEST_STRIPE_PRICE_MAP` **test override**.

**Working:** frontend is live — `fleetlix.com/?promo=letsrecycle#pricing` turns
each plan CTA into "Start 30-day free trial". Live-mode Operator checkout
succeeded earlier (saw the Stripe page).

**BLOCKER — SOLVED 15 Jul (was misdiagnosed).** It was **not** an uncatchable
runtime kill. `wrangler pages deployment tail` on the live deployment showed the
invocation logging `- Ok` and then:
> `checkout: Stripe error 400` — "No such price: 'price_1TXiQtEJrNyzHXg06WdnxHjl';
> a similar object exists in **live mode, but a test mode key was used**."

Two facts:
1. **Root cause (config):** `TEST_STRIPE_PRICE_MAP` holds **live** price ids.
   In test mode Stripe rejects them → the code catches it and returns a
   controlled `json(502,…)`. No crash.
2. **Why it looked like a crash:** Cloudflare's edge rewrites **any 5xx** a Pages
   Function returns into an opaque `error code: 502` text page, discarding the
   JSON body. Confirmed threshold: 400/403 pass through as JSON; only the 5xx is
   masked. That's why the browser saw a "bare 502" and the last session
   concluded (wrongly) that the worker died mid-fetch.

**Fix — Chris's env action + code hardening (done):**
- **Env (Chris):** put real **test-mode** `price_…` ids in `TEST_STRIPE_PRICE_MAP`
  (create the 5 prices in Stripe test mode first), and set
  `CHECKOUT_SUCCESS_URL=https://fleetlix.com/thank-you?session_id={CHECKOUT_SESSION_ID}`
  for testing. Redeploy.
- **Code (done, unpushed):** the three upstream-failure `502`s in
  `functions/api/checkout.ts` are now `409` so the real error reaches the client.
  `/thank-you` "Open the app" now points at `https://fleetlix.app`.

**Diagnostic still deployed (`d490e68`):**
`curl -X POST 'https://fleetlix.com/api/checkout?debug=1' … -d '{"plan":"depot","promo":"letsrecycle"}'`
returns the resolved `mode`, key **prefix** + length, and `priceId` without
calling Stripe. Remove with the other temp scaffolding once test checkout works.

**Deploy gotcha learned:** Cloudflare function deploys propagate to the edge
with a **lag** (dashboard can show a commit as Production before the edge
serves it). And "Retry deployment" on an OLD deployment re-promotes old code —
after a push, retry the **newest** deployment.

## 🧹 Temp debug — REMOVED 15 Jul (commit `d84f60b`)
Both the `build:"guarded"` field and the `?debug=1` branch are gone from
`functions/api/checkout.ts`, verified in prod. Also shipped 15 Jul:
`src/scripts/thank-you.ts` (commit `f4c3ee3`) forwards the Stripe
`session_id` from `/thank-you` to `fleetlix.app/onboarding`.

## 🔧 Open — config / Chris's actions (not code)
1. **Resend send address:** set `INTEREST_FROM_EMAIL = Fleetlix <contact@fleetlix.com>`
   in Cloudflare Production + redeploy (code/docs done; env change pending).
2. **Checkout go-live:** after the 502 is fixed and tested, set live
   `STRIPE_SECRET_KEY` + `STRIPE_PRICE_MAP` (live price ids in
   `Resources/stripe-pricing-id.md`) and **remove** the `TEST_*` vars.
3. **ICO registration** for FLEETLIX LTD → add the number to `privacy.astro` §1 & §12.
4. **Registered-office postcode** → complete the address in footer/privacy.

## 🔜 Next build phase — the app side (Fleetlix-App repo, NOT here)
The flow dead-ends at Stripe's `success_url` = `fleetlix.app/onboarding` (doesn't
exist). To finish the checkout-first flow, in the **Fleetlix-App** repo:
1. `/onboarding` page — read `?session_id=`, confirm the paid session, prompt
   for a password (create login).
2. Tenant-provisioning Function — create tenant + user (Supabase admin) from the
   Stripe session, link the subscription, set plan from the subscription metadata
   (`plan`/`promo` are stamped on it).
3. `promo_codes` migration (`081_*`) if DB-backed promos/redemption wanted.
4. Confirm `functions/api/billing/stripe-webhook.ts` sets `tenant.plan` on
   `checkout.session.completed`.
App recon + conventions captured in the `promo-checkout-plan` memory.
