// Cloudflare Pages Function: POST /api/checkout
//
// Creates a Stripe Checkout Session for the paid-signup flow. The customer
// pays on Stripe (which collects their details + card and starts a free
// trial), then Stripe redirects to the app's onboarding page where they
// create their login. This function runs on the marketing site only; the
// tenant is provisioned app-side from the resulting subscription.
//
// GATED: a valid promo code is REQUIRED — checkout is only offered to people
// who arrived with one (e.g. from the printed card's letsrecycle code). The
// promo sets the trial length (it discounts time, not price, so no Stripe
// coupon is involved).
//
// Self-contained on purpose: no imports from src/ or elsewhere, so the payment
// path can't break on a cross-boundary bundling change. Keep PLAN_SLUGS/PROMOS
// in sync with src/config/checkout.ts.

type Env = {
  STRIPE_SECRET_KEY?: string;
  // JSON map of plan slug -> Stripe price id(s). Two accepted shapes:
  //   {"operator":"price_..."}                        -> monthly only
  //   {"operator":{"month":"price_...","year":"price_..."}}
  // The flat form is the original one and still works, so the live env var
  // keeps functioning unchanged until annual prices exist in Stripe; a plan
  // with no id for the requested interval fails with a graceful 400.
  STRIPE_PRICE_MAP?: string;
  // Test override: when TEST_STRIPE_SECRET_KEY is set, the function runs
  // entirely in test mode (test key + TEST_STRIPE_PRICE_MAP, which must hold
  // test-mode price ids). Remove both to go live. This keeps the live key and
  // price map in place and untouched while testing.
  TEST_STRIPE_SECRET_KEY?: string;
  TEST_STRIPE_PRICE_MAP?: string;
  CHECKOUT_SUCCESS_URL?: string;
  CHECKOUT_CANCEL_URL?: string;
  // Escape hatch only. Stripe Tax is ON by default because every price on the
  // site is published ex-VAT — without it FLEETLIX LTD would absorb the VAT on
  // every UK sale. Set to "off" ONLY if Stripe Tax isn't yet enabled on the
  // account, since session creation fails outright in that state.
  STRIPE_AUTOMATIC_TAX?: string;
};

type Ctx = { request: Request; env: Env };

const PLAN_SLUGS = ["operator", "workshop", "depot", "haulier", "network"] as const;
type PlanSlug = (typeof PLAN_SLUGS)[number];

// Keep in sync with src/config/checkout.ts.
const PROMOS: Record<string, { trialDays: number }> = {
  letsrecycle: { trialDays: 30 },
};

// Billing intervals the pricing toggle can ask for. Annual is 10x monthly
// (two months free) — a separate Stripe Price, not a discount on the monthly.
const INTERVALS = ["month", "year"] as const;
type Interval = (typeof INTERVALS)[number];

const DEFAULT_SUCCESS_URL =
  "https://fleetlix.app/onboarding?session_id={CHECKOUT_SESSION_ID}";
const DEFAULT_CANCEL_URL = "https://fleetlix.com/#pricing";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

function resolvePromo(raw: unknown): { code: string; trialDays: number } | null {
  const code = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const promo = PROMOS[code];
  return promo ? { code, ...promo } : null;
}

// Resolves plan + interval to a Stripe price id across both accepted map
// shapes. Returns undefined for anything missing or malformed — the caller
// turns that into a 400 rather than posting a junk id to Stripe.
function resolvePriceId(
  raw: string | undefined,
  plan: PlanSlug,
  interval: Interval,
): string | undefined {
  if (!raw) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== "object") return undefined;

  const entry = (parsed as Record<string, unknown>)[plan];
  // Flat form: one id, monthly by definition. An annual request against a flat
  // map has no price to charge, so it must fail rather than silently bill
  // monthly at the annual figure.
  if (typeof entry === "string") {
    return interval === "month" && entry ? entry : undefined;
  }
  if (entry && typeof entry === "object") {
    const id = (entry as Record<string, unknown>)[interval];
    return typeof id === "string" && id ? id : undefined;
  }
  return undefined;
}

const handleCheckout = async ({ request, env }: Ctx): Promise<Response> => {
  // Test override takes precedence so testing never touches the live key.
  const useTest = Boolean(env.TEST_STRIPE_SECRET_KEY);
  // .trim() defends against a stray newline/space pasted into the env var,
  // which would otherwise make the Authorization header invalid and throw.
  const secretKey = (useTest ? env.TEST_STRIPE_SECRET_KEY : env.STRIPE_SECRET_KEY)?.trim();
  const priceMapRaw = useTest ? env.TEST_STRIPE_PRICE_MAP : env.STRIPE_PRICE_MAP;

  if (!secretKey || !priceMapRaw) {
    console.error(
      `checkout: not configured — mode=${useTest ? "test" : "live"}, ` +
        `secretKey=${secretKey ? "set" : "MISSING"}, ` +
        `priceMap=${priceMapRaw ? "set" : "MISSING"}`,
    );
    return json(503, { error: "Checkout isn't available yet." });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const { plan, promo, interval } = (body ?? {}) as {
    plan?: unknown;
    promo?: unknown;
    interval?: unknown;
  };

  // Validate plan.
  if (typeof plan !== "string" || !PLAN_SLUGS.includes(plan as PlanSlug)) {
    return json(400, { error: "Unknown plan." });
  }

  // Interval is optional — an older cached client sends none and means monthly.
  const billing: Interval = INTERVALS.includes(interval as Interval)
    ? (interval as Interval)
    : "month";

  const taxEnabled = env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() !== "off";

  // Gate: a valid promo is required.
  const resolved = resolvePromo(promo);
  if (!resolved) {
    return json(403, { error: "This checkout requires a valid promo code." });
  }

  // Look up the plan's Stripe price for the requested interval. A plan/interval
  // with no configured id (e.g. annual before the yearly prices are created)
  // fails gracefully rather than charging the wrong thing.
  const priceId = resolvePriceId(priceMapRaw, plan as PlanSlug, billing);
  if (!priceId) {
    return json(400, {
      error:
        billing === "year"
          ? "Annual billing isn't available for that plan yet."
          : "That plan isn't available for checkout yet.",
    });
  }

  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": String(resolved.trialDays),
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][promo]": resolved.code,
    "subscription_data[metadata][interval]": billing,
    "metadata[plan]": plan,
    "metadata[promo]": resolved.code,
    "metadata[interval]": billing,
    // Ex-VAT prices, so Stripe Tax works out and adds the VAT: 20% for a UK
    // business, reverse charge for a VAT-registered business outside the UK,
    // destination VAT for an EU consumer. The prices themselves must be
    // created with tax_behavior: 'exclusive' — that's immutable per price, so
    // getting it wrong means recreating them.
    "automatic_tax[enabled]": String(taxEnabled),
    // Lets a business enter its VAT number, which is what triggers the reverse
    // charge rather than charging them UK VAT they'd have to reclaim.
    "tax_id_collection[enabled]": String(taxEnabled),
    billing_address_collection: "required",
    success_url: env.CHECKOUT_SUCCESS_URL || DEFAULT_SUCCESS_URL,
    cancel_url: env.CHECKOUT_CANCEL_URL || DEFAULT_CANCEL_URL,
  });

  let sessionUrl: string | undefined;
  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("checkout: Stripe error", res.status, detail);
      // 409, not 502: Cloudflare's edge replaces ANY 5xx returned by a Pages
      // Function with its own opaque "error code: 502" text page, discarding
      // this JSON body — so the client (src/scripts/checkout.ts) never sees
      // data.error. A 4xx passes through untouched. (This masking is exactly
      // what made an in-code 502 look like an uncatchable runtime crash.)
      return json(409, { error: "Couldn't start checkout. Try again shortly." });
    }

    const session = (await res.json()) as { url?: string };
    sessionUrl = session.url;
  } catch (err) {
    // Any exception (invalid header, network, JSON) — log it and fail
    // gracefully. 409 not 5xx so the JSON body survives Cloudflare's edge,
    // which would otherwise mask a 5xx as an opaque "error code: 502" page.
    console.error(
      "checkout: Stripe request threw",
      err instanceof Error ? err.message : String(err),
    );
    return json(409, { error: "Couldn't start checkout. Try again shortly." });
  }

  if (!sessionUrl) {
    console.error("checkout: Stripe returned no url");
    return json(409, { error: "Couldn't start checkout. Try again shortly." });
  }

  return json(200, { url: sessionUrl });
};

// Top-level guard: a payment endpoint must never return a bare Cloudflare 502.
// Anything that slips past the inner handlers is logged (with a stack) and
// returned as a controlled JSON error.
export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  try {
    return await handleCheckout(ctx);
  } catch (err) {
    console.error(
      "checkout: unhandled exception",
      err instanceof Error ? err.stack || err.message : String(err),
    );
    return json(500, { error: "Checkout error. Try again shortly." });
  }
};
