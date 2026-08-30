// Cloudflare Pages Function: GET /api/checkout-session?session_id=cs_…
//
// Reads back a completed Stripe Checkout Session so the welcome screen
// (/thank-you) can show the buyer what they actually bought — plan, billing
// interval, when the trial ends, what lands on the card then, and which email
// the receipt went to — instead of a generic "thanks".
//
// This is the middle step of the paid-signup flow:
//   pricing card → Stripe Checkout → /thank-you (here) → fleetlix.app/onboarding
// The page is statically rendered, so the session id is only knowable in the
// browser; the browser can't be trusted with a Stripe key, so the lookup has to
// happen here.
//
// READ-ONLY, and deliberately narrow: it returns a hand-written summary, never
// a proxied Stripe object. A Checkout Session carries the customer's address,
// card brand and tax ids; none of that has any business being fetched by
// whoever holds the URL.
//
// Self-contained on purpose, exactly like functions/api/checkout.ts — no
// imports from src/, so the payment path can't break on a bundling change.
// Keep the env handling here in step with that file.

type Env = {
  STRIPE_SECRET_KEY?: string;
  // Test override: when TEST_STRIPE_SECRET_KEY is set, checkout.ts creates
  // sessions in test mode, so this must read them back with the same key —
  // a live key returns 404 for a test session id (and vice versa). Mirror the
  // precedence rule exactly or the welcome screen goes blank in test mode.
  TEST_STRIPE_SECRET_KEY?: string;
};

type Ctx = { request: Request; env: Env };

// Stripe session ids are high-entropy and opaque. Validating the shape keeps
// junk out of the upstream URL; it is not a security boundary (holding the id
// IS the capability, same as on the app's onboarding endpoint, which uses this
// same pattern).
const SESSION_ID = /^cs_[A-Za-z0-9_]+$/;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Never cached: it carries the buyer's email, and a shared cache in
      // front of this would hand one customer's summary to the next.
      "cache-control": "no-store",
    },
  });

type StripeSession = {
  status?: string;
  payment_status?: string;
  livemode?: boolean;
  currency?: string;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
  subscription?: {
    trial_end?: number | null;
    items?: {
      data?: Array<{
        price?: {
          unit_amount?: number | null;
          currency?: string;
          recurring?: { interval?: string } | null;
        } | null;
      }>;
    } | null;
  } | null;
};

const handleSession = async ({ request, env }: Ctx): Promise<Response> => {
  const useTest = Boolean(env.TEST_STRIPE_SECRET_KEY);
  const secretKey = (useTest ? env.TEST_STRIPE_SECRET_KEY : env.STRIPE_SECRET_KEY)?.trim();

  // 503 rather than an error: the welcome screen treats "not configured" as
  // "show the static page without a summary card", which is the correct
  // behaviour before the Stripe env vars are set.
  if (!secretKey) {
    return json(503, { error: "Session lookup isn't available yet." });
  }

  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId || !SESSION_ID.test(sessionId)) {
    return json(400, { error: "Missing or malformed session id." });
  }

  // Expanding the subscription is what carries trial_end and the recurring
  // price. Without it the page could only say "thanks", not "your first
  // payment is on 13 September" — which is the question a buyer actually has.
  const url =
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}` +
    `?expand[]=subscription`;

  let session: StripeSession;
  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${secretKey}` },
    });

    if (res.status === 404) {
      return json(404, { error: "That checkout session wasn't found." });
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("checkout-session: Stripe error", res.status, detail);
      // 409, not 5xx: Cloudflare's edge replaces any 5xx from a Pages Function
      // with its own opaque error page and discards this JSON body. Same
      // reasoning as functions/api/checkout.ts.
      return json(409, { error: "Couldn't load your order just now." });
    }

    session = (await res.json()) as StripeSession;
  } catch (err) {
    console.error(
      "checkout-session: Stripe request threw",
      err instanceof Error ? err.message : String(err),
    );
    return json(409, { error: "Couldn't load your order just now." });
  }

  // Only a completed session describes a purchase. An abandoned ("open") or
  // "expired" session gets its status back and nothing else — no email, no
  // amounts — so a stale or guessed link can't be turned into a lookup of
  // someone's details.
  if (session.status !== "complete") {
    return json(200, { status: session.status ?? "unknown", mode: session.livemode ? "live" : "test" });
  }

  const item = session.subscription?.items?.data?.[0]?.price;
  const trialEnd = session.subscription?.trial_end;

  return json(200, {
    status: "complete",
    // Surfaced so the page can badge a test-mode run. A test signup that looks
    // identical to a real one is how you end up believing you've taken money
    // you haven't.
    mode: session.livemode ? "live" : "test",
    // metadata is stamped by functions/api/checkout.ts at session creation.
    plan: session.metadata?.plan ?? null,
    promo: session.metadata?.promo ?? null,
    interval: item?.recurring?.interval ?? session.metadata?.interval ?? null,
    // The buyer's own address, on their own noindex receipt page, over
    // same-origin fetch, on a site with no third-party scripts and a
    // strict-origin referrer policy. Shown in full and not masked on purpose:
    // the one useful thing to do with it here is spot a typo before the
    // welcome email goes to an address that doesn't exist.
    email: session.customer_details?.email ?? null,
    // Unix seconds → ISO date. The page renders it against the reader's
    // locale; sending a preformatted string would bake in the build's timezone.
    trialEnd: typeof trialEnd === "number" ? new Date(trialEnd * 1000).toISOString() : null,
    // EX VAT, matching every price published on this site — Stripe Tax adds
    // the VAT on top at invoice time. The page must render the "+ VAT" suffix
    // with it; an unqualified figure is a misquote to a business buyer.
    amount: typeof item?.unit_amount === "number" ? item.unit_amount : null,
    currency: (item?.currency ?? session.currency ?? "gbp").toUpperCase(),
  });
};

// Top-level guard: never let a bare Cloudflare 502 be the thing a customer sees
// immediately after paying.
export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  try {
    return await handleSession(ctx);
  } catch (err) {
    console.error(
      "checkout-session: unhandled exception",
      err instanceof Error ? err.stack || err.message : String(err),
    );
    return json(409, { error: "Couldn't load your order just now." });
  }
};
