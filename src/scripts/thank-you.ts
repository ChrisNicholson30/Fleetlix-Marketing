// Hand the Stripe checkout session to the app's paid-signup onboarding.
//
// Stripe redirects here after payment (success_url =
// fleetlix.com/thank-you?session_id=cs_…), so this celebratory page already
// carries the session id. The "Open the app" button must pass that id on to the
// app's locked signup at fleetlix.app/onboarding?session_id=… — that id is the
// capability the onboarding endpoint uses to confirm the paid session and
// provision the tenant. Drop it and the app can't verify payment, so the buyer
// can't create their login.
//
// The page is statically rendered, so the id is only knowable client-side: read
// it here and rewrite the href. Imports ./lib/env so Astro emits this as an
// external /_astro/*.js file under script-src 'self' (no CSP hash). See
// public/_headers.
import { qs } from "./lib/env";

const APP_ORIGIN = "https://fleetlix.app";

const link = qs<HTMLAnchorElement>("[data-open-app]");
if (link) {
  const sessionId = new URLSearchParams(window.location.search)
    .get("session_id")
    ?.trim();

  // Only a well-formed Stripe session id unlocks onboarding; anything else
  // keeps the fallback href (the app root, which routes to sign-in). Mirrors
  // the server-side ^cs_[A-Za-z0-9_]+$ check in the app's provision function.
  if (sessionId && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    link.href = `${APP_ORIGIN}/onboarding?session_id=${encodeURIComponent(sessionId)}`;
  }
}
