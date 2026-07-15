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
  // JSON map of plan slug -> Stripe monthly price id, e.g.
  // {"operator":"price_...","workshop":"price_...","depot":"price_..."}
  STRIPE_PRICE_MAP?: string;
  // Test override: when TEST_STRIPE_SECRET_KEY is set, the function runs
  // entirely in test mode (test key + TEST_STRIPE_PRICE_MAP, which must hold
  // test-mode price ids). Remove both to go live. This keeps the live key and
  // price map in place and untouched while testing.
  TEST_STRIPE_SECRET_KEY?: string;
  TEST_STRIPE_PRICE_MAP?: string;
  CHECKOUT_SUCCESS_URL?: string;
  CHECKOUT_CANCEL_URL?: string;
};

type Ctx = { request: Request; env: Env };

const PLAN_SLUGS = ["operator", "workshop", "depot", "haulier", "network"] as const;
type PlanSlug = (typeof PLAN_SLUGS)[number];

// Keep in sync with src/config/checkout.ts.
const PROMOS: Record<string, { trialDays: number }> = {
  letsrecycle: { trialDays: 30 },
};

// Monthly only — the yearly option is scrapped.
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

function parsePriceMap(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
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

  const { plan, promo } = (body ?? {}) as { plan?: unknown; promo?: unknown };

  // Validate plan.
  if (typeof plan !== "string" || !PLAN_SLUGS.includes(plan as PlanSlug)) {
    return json(400, { error: "Unknown plan." });
  }

  // Gate: a valid promo is required.
  const resolved = resolvePromo(promo);
  if (!resolved) {
    return json(403, { error: "This checkout requires a valid promo code." });
  }

  // Look up the plan's Stripe price. A plan without a configured price id
  // (e.g. the one plan not yet created in Stripe) fails gracefully.
  const priceId = parsePriceMap(priceMapRaw)[plan];
  if (!priceId) {
    return json(400, { error: "That plan isn't available for checkout yet." });
  }

  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "subscription_data[trial_period_days]": String(resolved.trialDays),
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][promo]": resolved.code,
    "metadata[plan]": plan,
    "metadata[promo]": resolved.code,
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
