// Cloudflare Pages Function: POST /api/checkout
//
// Creates a Stripe Checkout Session for the paid-signup flow. The customer
// pays on Stripe (which collects their details + card and, on a promo, starts a
// free trial), then Stripe redirects to the welcome screen at /thank-you, which
// confirms what they bought and hands them on to the app to create their
// login. This function runs on the marketing site only; the tenant is
// provisioned app-side from the resulting subscription.
//
//   pricing card → Stripe Checkout → /thank-you → fleetlix.app/onboarding
//
// SALES ARE PAUSED (17 Sep 2026) while the payment system is being changed.
// SALES_PAUSED below refuses every plan except Broker Pro before Stripe is
// called, whatever the client sends, and BROKER_PRO_EARN_ONLY refuses Broker Pro
// as well, so right now this function sells nothing. The two gates underneath
// are left intact for when sales reopen: flip each switch here AND in
// src/config/checkout.ts, in the same commit.
//
// TWO GATES:
//
//   - OPEN_PLANS — Operator (£99/month or £990/year), Fleetlix Compliance (£49)
//     and Broker Pro (£249) — can be bought by anyone: no code, no trial. A promo
//     sent with one is ignored. Each price is found by LOOKUP KEY and checked
//     before a session is created, never through STRIPE_PRICE_MAP — the app's
//     parser throws on a non-carrier entry there, and the marketing map still
//     holds the stale v1 ladder (Resources/stripe-pricing-id.md). Broker Free is
//     not sold here at all: it is £0 with no card, and signs up directly on
//     fleetlix.app/broker/sign-up.
//
//   - Workshop, Depot, Haulier and Network are GATED: a valid promo code is
//     REQUIRED, and the promo sets the trial length (it discounts time, not
//     price, so no Stripe coupon is involved). Prices come from STRIPE_PRICE_MAP.
//
// Self-contained on purpose: no imports from src/ or elsewhere, so the payment
// path can't break on a cross-boundary bundling change. Keep PLAN_SLUGS/PROMOS/
// OPEN_PLANS in sync with src/config/checkout.ts, and OPEN_PLANS with the app,
// which provisions and honours what is sold here (shared/plans for Operator,
// shared/billing/broker.ts and shared/billing/compliance.ts for the other two).

type Env = {
  STRIPE_SECRET_KEY?: string;
  // JSON map of plan slug -> Stripe price id(s). Two accepted shapes:
  //   {"workshop":"price_..."}                        -> monthly only
  //   {"workshop":{"month":"price_...","year":"price_..."}}
  // The flat form is the original one and still works, so the live env var
  // keeps functioning unchanged until annual prices exist in Stripe; a plan
  // with no id for the requested interval fails with a graceful 400.
  // Promo-gated plans only — OPEN_PLANS never read it.
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
  STRIPE_TOS_CONSENT?: string;
};

type Ctx = { request: Request; env: Env };

const PLAN_SLUGS = ["operator", "workshop", "depot", "haulier", "network"] as const;
type PlanSlug = (typeof PLAN_SLUGS)[number];

// Keep in sync with src/config/checkout.ts.
const PROMOS: Record<string, { trialDays: number }> = {
  fleet30: { trialDays: 30 },
  letsrecycle: { trialDays: 14 },
};

// Billing intervals the pricing toggle can ask for. Annual is 10x monthly
// (two months free) — a separate Stripe Price, not a discount on the monthly.
const INTERVALS = ["month", "year"] as const;
type Interval = (typeof INTERVALS)[number];

type OpenPrice = { lookupKey: string; unitAmount: number };

// Plans anyone can buy. Each interval a plan sells on has its own price, and
// `unitAmount` is what that price MUST be before it is sold — a lookup key
// moved onto a mispriced object in the Dashboard is refused rather than
// charged. An interval with no entry is not sold. `tenantType` is stamped so
// the app's onboarding can cross-check it against the billed price.
const OPEN_PLANS: Record<string, { tenantType: string; cancelUrl: string; prices: Partial<Record<Interval, OpenPrice>> }> = {
  operator: {
    tenantType: "carrier",
    cancelUrl: "https://fleetlix.com/#pricing",
    prices: {
      month: { lookupKey: "fleetlix_operator_monthly_gbp", unitAmount: 9900 },
      year: { lookupKey: "fleetlix_operator_annual_gbp", unitAmount: 99000 },
    },
  },
  broker_pro: {
    tenantType: "broker",
    cancelUrl: "https://fleetlix.com/brokers#broker-plans",
    prices: { month: { lookupKey: "fleetlix_broker_pro_monthly_gbp", unitAmount: 24900 } },
  },
  compliance: {
    tenantType: "compliance",
    cancelUrl: "https://fleetlix.com/#compliance-tier",
    prices: { month: { lookupKey: "fleetlix_compliance_monthly_gbp", unitAmount: 4900 } },
  },
};
const isOpenPlan = (v: unknown): v is string =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(OPEN_PLANS, v);

// The sales pause. While it is on, Broker Pro is the only plan sold here (Broker
// Free never comes through this function at all), and every other request is
// refused with PAUSED_ERROR before a price is looked up. Mirrors SALES_PAUSED in
// src/config/checkout.ts, which only decides what the pages offer. This copy is
// the one that actually stops a payment, so it is never the one to leave behind.
const SALES_PAUSED: boolean = true;
const SOLD_WHILE_PAUSED: ReadonlySet<string> = new Set(["broker_pro"]);
// Quoted verbatim in src/config/support.ts (checkoutIssues) — change both.
const PAUSED_ERROR = "New subscriptions are paused for now.";

// Broker Pro is earned through carrier referrals, never bought, while this is on
// (17 Sep 2026). Separate from the pause on purpose: reopening the other plans
// does not reopen Pro. Mirrors BROKER_PRO_EARN_ONLY in src/config/checkout.ts.
const BROKER_PRO_EARN_ONLY: boolean = true;
// Quoted verbatim in src/config/support.ts (checkoutIssues) — change both.
const EARN_ONLY_ERROR = "Broker Pro can only be earned right now.";

const OPEN_CURRENCY = "gbp";

// The welcome screen, NOT the app. Stripe hands back a completed session and
// nothing else; dropping a buyer straight onto a login form gives them no
// confirmation of what they just bought (the receipt email is minutes behind)
// and no route back if the app is mid-deploy. /thank-you reads the session
// back through /api/checkout-session, states the plan, trial end and first
// charge, then links on to fleetlix.app/onboarding carrying the same id.
// The literal {CHECKOUT_SESSION_ID} placeholder is substituted by Stripe and
// must survive any override — the app can't provision the tenant without it.
const DEFAULT_SUCCESS_URL =
  "https://fleetlix.com/thank-you?session_id={CHECKOUT_SESSION_ID}";
const DEFAULT_CANCEL_URL = "https://fleetlix.com/#pricing";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Appends a query parameter by string, not through URL(): URL would
// percent-encode the braces in {CHECKOUT_SESSION_ID}, and Stripe would then
// leave the placeholder unsubstituted.
const withParam = (url: string, key: string, value: string) =>
  `${url}${url.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;

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

type StripePrice = {
  id?: string;
  active?: boolean;
  lookup_key?: string | null;
  currency?: string;
  unit_amount?: number | null;
  tax_behavior?: string | null;
  recurring?: { interval?: string; interval_count?: number } | null;
};

// Why this price must not be sold, or an empty list. Checked on every checkout
// because a lookup key is only a pointer: it can be transferred in the
// Dashboard to a price with a different amount, cadence or tax behaviour.
function openPlanSaleProblems(expected: OpenPrice, interval: Interval, prices: StripePrice[]): string[] {
  if (prices.length > 1) return [`${prices.length} active prices carry the lookup key`];
  const price = prices[0];
  if (!price?.id) return ["no active price carries the lookup key"];
  const problems: string[] = [];
  if (price.active === false) problems.push("price is archived");
  if (price.currency !== OPEN_CURRENCY) problems.push(`currency ${price.currency}`);
  if (price.unit_amount !== expected.unitAmount) problems.push(`amount ${price.unit_amount}`);
  if (price.tax_behavior !== "exclusive") problems.push(`tax_behavior ${price.tax_behavior}`);
  const r = price.recurring;
  if (!r || r.interval !== interval || (r.interval_count ?? 1) !== 1) {
    problems.push(`does not bill every one ${interval}`);
  }
  return problems;
}

async function findPrices(secretKey: string, lookupKey: string): Promise<StripePrice[] | undefined> {
  // limit=2 so a second active price on the same key is seen and refused,
  // rather than one of the two being sold at random.
  const url =
    "https://api.stripe.com/v1/prices?active=true&limit=2" +
    `&lookup_keys[]=${encodeURIComponent(lookupKey)}`;
  const res = await fetch(url, { headers: { authorization: `Bearer ${secretKey}` } });
  if (!res.ok) {
    console.error(`checkout: ${lookupKey} price lookup failed`, res.status, await res.text().catch(() => ""));
    return undefined;
  }
  const data = (await res.json()) as { data?: StripePrice[] };
  return data.data ?? [];
}

// Posts a Checkout Session and turns every failure into a controlled JSON 409.
// 409, not 5xx: Cloudflare's edge replaces ANY 5xx returned by a Pages Function
// with its own opaque "error code: 502" text page, discarding this JSON body —
// so the client (src/scripts/checkout.ts) never sees data.error. A 4xx passes
// through untouched.
async function createSession(secretKey: string, form: URLSearchParams): Promise<Response> {
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
      return json(409, { error: "Couldn't start checkout. Try again shortly." });
    }

    const session = (await res.json()) as { url?: string };
    if (!session.url) {
      console.error("checkout: Stripe returned no url");
      return json(409, { error: "Couldn't start checkout. Try again shortly." });
    }
    return json(200, { url: session.url });
  } catch (err) {
    console.error(
      "checkout: Stripe request threw",
      err instanceof Error ? err.message : String(err),
    );
    return json(409, { error: "Couldn't start checkout. Try again shortly." });
  }
}

const handleCheckout = async ({ request, env }: Ctx): Promise<Response> => {
  // Test override takes precedence so testing never touches the live key.
  const useTest = Boolean(env.TEST_STRIPE_SECRET_KEY);
  // .trim() defends against a stray newline/space pasted into the env var,
  // which would otherwise make the Authorization header invalid and throw.
  const secretKey = (useTest ? env.TEST_STRIPE_SECRET_KEY : env.STRIPE_SECRET_KEY)?.trim();
  const priceMapRaw = useTest ? env.TEST_STRIPE_PRICE_MAP : env.STRIPE_PRICE_MAP;

  if (!secretKey) {
    console.error(`checkout: not configured — mode=${useTest ? "test" : "live"}, secretKey=MISSING`);
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

  // Ahead of both gates, so a page opened before the pause, a hand-built
  // request and a valid promo code all get the same answer. 409, not 5xx, for
  // the reason given at createSession: Cloudflare would swallow the message.
  if (BROKER_PRO_EARN_ONLY && plan === "broker_pro") {
    return json(409, { error: EARN_ONLY_ERROR });
  }
  if (SALES_PAUSED && !(typeof plan === "string" && SOLD_WHILE_PAUSED.has(plan))) {
    return json(409, { error: PAUSED_ERROR });
  }

  const taxEnabled = env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() !== "off";
  // Terms-of-service acceptance. Stripe renders a required tick box and records
  // the acceptance against the session, which is what makes /terms-of-service
  // binding and gives us evidence in a dispute — section 2 of that page
  // describes exactly this mechanism, so switching it off makes the page untrue.
  //
  // PREREQUISITE: the terms URL is configured in the Stripe DASHBOARD, not in
  // this request — the API has no field for it. Until it is set, Stripe rejects
  // session creation outright, exactly like automatic_tax does without Stripe
  // Tax enabled. STRIPE_TOS_CONSENT=off is the escape hatch for unblocking a
  // test, not a setting to leave off: checkout would then take money without
  // anyone having accepted the terms.
  const tosConsent = env.STRIPE_TOS_CONSENT?.trim().toLowerCase() !== "off";

  // Shared by both gates: ex-VAT prices, so Stripe Tax works out and adds the
  // VAT — 20% for a UK business, reverse charge for a VAT-registered business
  // outside the UK. Prices must be created with tax_behavior: 'exclusive',
  // which is immutable per price.
  const commonFields = {
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "automatic_tax[enabled]": String(taxEnabled),
    // Lets a business enter its VAT number, which is what triggers the reverse
    // charge rather than charging them UK VAT they'd have to reclaim.
    "tax_id_collection[enabled]": String(taxEnabled),
    billing_address_collection: "required",
    ...(tosConsent ? { "consent_collection[terms_of_service]": "required" } : {}),
  };

  // ── Open plans: anyone, no trial, and any promo is ignored ────────────────
  if (isOpenPlan(plan)) {
    // No interval means monthly, which is what the cards show by default.
    const billing = interval === undefined ? "month" : interval;
    const expected = INTERVALS.includes(billing as Interval)
      ? OPEN_PLANS[plan].prices[billing as Interval]
      : undefined;
    if (!expected) {
      return json(400, {
        error: billing === "year" ? "This plan is billed monthly." : "Unknown billing interval.",
      });
    }

    const prices = await findPrices(secretKey, expected.lookupKey);
    const problems = prices ? openPlanSaleProblems(expected, billing as Interval, prices) : ["price lookup failed"];
    const priceId = prices?.[0]?.id;
    if (problems.length || !priceId) {
      console.error(
        `checkout: refusing to sell ${plan} ${billing} (mode=${useTest ? "test" : "live"}) — ${problems.join("; ")}`,
      );
      return json(409, { error: "This plan isn't available for checkout right now." });
    }

    const { tenantType, cancelUrl } = OPEN_PLANS[plan];
    const form = new URLSearchParams({
      ...commonFields,
      "line_items[0][price]": priceId,
      "subscription_data[metadata][plan]": plan,
      "subscription_data[metadata][plan_code]": plan,
      "subscription_data[metadata][tenant_type]": tenantType,
      "subscription_data[metadata][interval]": billing as string,
      "metadata[plan]": plan,
      "metadata[tenant_type]": tenantType,
      "metadata[interval]": billing as string,
      // plan= lets the welcome screen show the right next steps before the
      // session read-back lands, and when it can't run at all.
      success_url: withParam(env.CHECKOUT_SUCCESS_URL || DEFAULT_SUCCESS_URL, "plan", plan),
      cancel_url: cancelUrl,
    });
    return createSession(secretKey, form);
  }

  // ── Workshop, Depot, Haulier, Network: promo-gated ────────────────────────
  if (typeof plan !== "string" || !PLAN_SLUGS.includes(plan as PlanSlug)) {
    return json(400, { error: "Unknown plan." });
  }

  if (!priceMapRaw) {
    console.error(`checkout: not configured — mode=${useTest ? "test" : "live"}, priceMap=MISSING`);
    return json(503, { error: "Checkout isn't available yet." });
  }

  // Interval is optional — an older cached client sends none and means monthly.
  const billing: Interval = INTERVALS.includes(interval as Interval)
    ? (interval as Interval)
    : "month";

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
    ...commonFields,
    "line_items[0][price]": priceId,
    "subscription_data[trial_period_days]": String(resolved.trialDays),
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][promo]": resolved.code,
    "subscription_data[metadata][interval]": billing,
    "metadata[plan]": plan,
    "metadata[promo]": resolved.code,
    "metadata[interval]": billing,
    success_url: env.CHECKOUT_SUCCESS_URL || DEFAULT_SUCCESS_URL,
    cancel_url: env.CHECKOUT_CANCEL_URL || DEFAULT_CANCEL_URL,
  });
  return createSession(secretKey, form);
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
