// Content for the /support page — the customer support document.
//
// The page does two jobs at once and both are load-bearing:
//
//   1. It is the page a paying customer reaches when something breaks — at
//      checkout, during the setup period, or in daily use.
//   2. It is the page Stripe reads. Stripe's website checklist requires
//      customer service contact information, a refund policy, a cancellation
//      policy and the terms of any promotion; its Public business information
//      has a literal "Support site URL" field, printed on every Stripe email
//      receipt and used during dispute handling. That field is this page.
//
// Because of (2), a claim removed from here is a claim removed from the
// evidence Stripe holds. Don't delete a policy section to tidy the page.
//
// THE RULE ON FIGURES: nothing numeric is typed here. Prices come from
// ./pricing, trial length from ./checkout, and the checkout failure messages
// mirror functions/api/checkout.ts verbatim. A support page that quotes its own
// copy of a price is the fastest way to end up telling a customer one number
// while Stripe charges another.
//
// The tabular content lives here; the prose lives in src/pages/support.astro,
// the same split /security and /digital-waste-tracking use.

import { SALES_PAUSED } from "./checkout";

export const SUPPORT = {
  /**
   * The published support address. Rendered everywhere /support and
   * /terms-of-service name a mailbox — 17 places at the last count — so this
   * const is the only handle on it.
   *
   * IT IS contact@ ON PURPOSE. This is the address Cloudflare Email Routing
   * actually forwards (to chris@cn-design.co.uk), and it is the value set as
   * the customer support email in Stripe's Public details — which Stripe
   * prints on every receipt. Those two must agree: a customer replying to a
   * receipt and a customer following the terms have to reach the same inbox.
   *
   * Before changing this to support@ or anything else: add the Email Routing
   * rule FIRST, then update Stripe's Public details in the same sitting. An
   * address published here but not routed black-holes people at the exact
   * moment they are trying to reach a human about money.
   */
  email: "contact@fleetlix.com",
  /**
   * The reply target, stated as a commitment. Kept as prose rather than a
   * number so it reads the same everywhere it is interpolated.
   */
  responseTarget: "one working day",
  hours: "Monday to Friday, 9am to 5pm UK time",
  /**
   * No phone number is published today. Stripe's checklist asks for contact
   * methods beyond a form, and its Public business information has a support
   * phone field — so this is a known, deliberate gap rather than an oversight.
   * Set a value here and section 1 renders it; leave it null and section 1
   * says plainly that there isn't one yet, which is the honest version.
   */
  phone: null as string | null,
  lastUpdated: "17 September 2026",
  lastUpdatedIso: "2026-09-17",
} as const;

/* ------------------------------------------------------------------ *
 * Contents. Order and ids must match the sections in
 * src/pages/support.astro — the sticky rail, the on-page numbering and
 * the scroll-spy all read this array, and PolicySection derives each
 * section number from its position here.
 * ------------------------------------------------------------------ */

export interface TocEntry {
  id: string;
  label: string;
}

export const contents: TocEntry[] = [
  { id: "contact", label: "How to reach us" },
  { id: "what-fleetlix-is", label: "What Fleetlix is" },
  { id: "plans", label: "Plans, prices and currency" },
  { id: "vat", label: "VAT" },
  { id: "trials", label: "Free trials and promo codes" },
  { id: "signing-up", label: "Signing up, step by step" },
  { id: "first-week", label: "Your first week" },
  { id: "billing", label: "Billing, invoices and receipts" },
  { id: "changing-plan", label: "Changing your plan" },
  { id: "cancelling", label: "Cancelling and refunds" },
  { id: "checkout-problems", label: "If checkout goes wrong" },
  { id: "app-problems", label: "If the app goes wrong" },
  { id: "availability", label: "Availability and known limits" },
  { id: "data-security", label: "Data, payment security and privacy" },
  { id: "who-we-are", label: "Who we are" },
];

/* ------------------------------------------------------------------ *
 * At a glance — the four things someone arriving in a hurry wants,
 * each linked to the section that answers it properly.
 * ------------------------------------------------------------------ */

export interface HelpRoute {
  label: string;
  headline: string;
  body: string;
  href: string;
  accent: "cyan" | "amber";
  /** Inner paths for a 24x24 stroked icon. */
  icon: string;
}

export const helpRoutes: HelpRoute[] = [
  {
    label: "Talk to us",
    headline: "One working day",
    body: "Every message reaches a person who can actually change something. There is no ticket queue and no first-line script.",
    href: "#contact",
    accent: "cyan",
    icon: `<path d="M4 4h16v12H7l-3 3z"/>`,
  },
  {
    label: "Just paid",
    headline: "What happens next",
    body: "You pay before your login exists, which surprises people. The six steps from card details to a working yard are set out in full.",
    href: "#signing-up",
    accent: "cyan",
    icon: `<path d="M9 11l3 3 6-6"/><path d="M21 12a9 9 0 1 1-4.2-7.6"/>`,
  },
  {
    label: "Billing",
    headline: "Cancel whenever",
    body: "No minimum term and no cancellation fee. Your access runs to the end of the period you have paid for.",
    href: "#cancelling",
    accent: "amber",
    icon: `<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>`,
  },
  {
    label: "Something broken",
    headline: "Read the message",
    body: "Every failure the checkout can produce is listed with what it actually means and what to do about it.",
    href: "#checkout-problems",
    accent: "cyan",
    icon: `<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>`,
  },
];

/* ------------------------------------------------------------------ *
 * The setup period. What the first week looks like between paying and
 * running real jobs through the product.
 * ------------------------------------------------------------------ */

export interface SetupStep {
  step: string;
  detail: string;
}

export const setupSteps: SetupStep[] = [
  {
    step: "Create your login",
    detail:
      "Stripe returns you to fleetlix.app to set a password. This is the step that turns a payment into an account, so do it before you close the tab — see section 6 if you already have.",
  },
  {
    step: "Add your vehicles",
    detail:
      "Registration, type and MOT date is enough to start. Maintenance dates, VOR status and compliance reminders build on that record, so it is worth getting the dates right once.",
  },
  {
    step: "Invite your team",
    detail:
      "Add people by role — Driver, Yard, Mechanic or Office. The role decides what they see. Admin is a permission an Office or Yard user holds; it never costs a seat.",
  },
  {
    step: "Get everyone installed",
    detail:
      "Fleetlix installs from the browser on any phone, tablet or desktop, with no app store account. Send drivers the install guide and it takes about a minute per handset.",
  },
  {
    step: "Connect Digital Waste Tracking",
    detail:
      "Your site API code goes in once and every waste movement is submitted from then on. If you do not have your Defra credentials yet, tell us and we will walk you through obtaining them.",
  },
  {
    step: "Bring your existing data across",
    detail:
      "Customers, sites and rates import from a spreadsheet. If yours is coming out of another system in an awkward shape, send it to us rather than reformatting it by hand.",
  },
];

/* ------------------------------------------------------------------ *
 * Checkout failures.
 *
 * `symptom` MUST match the string a customer actually sees. The checkout
 * script writes the server's error straight into the pricing button's
 * label and reverts it after 2.6 seconds, so what the customer reports
 * is a button that briefly said something odd. These strings are the
 * responses in functions/api/checkout.ts — if you change one there,
 * change it here, or this section starts describing a message nobody
 * will ever see.
 * ------------------------------------------------------------------ */

export interface CheckoutIssue {
  /**
   * "message" — symptom is the literal string the customer saw, rendered as
   * code so it can be matched by eye against a screenshot.
   * "behaviour" — symptom describes what happened instead.
   */
  kind: "message" | "behaviour";
  symptom: string;
  meaning: string;
  fix: string;
}

export const checkoutIssues: CheckoutIssue[] = [
  // The first two follow the sales pause (SALES_PAUSED in ./checkout).
  SALES_PAUSED
    ? {
        kind: "behaviour",
        symptom: "Every button says Register interest, apart from the broker plans",
        meaning:
          "New subscriptions are paused while we change how we take payments, so Operator, Fleetlix Compliance and the larger operations plans cannot be bought for the moment, with or without a promotion code. That is intended, not a fault.",
        fix: "Register your interest on the homepage form and we will let you know when sign-up reopens. Broker Free and Broker Pro are still open on the Broker Network page.",
      }
    : {
        kind: "behaviour",
        symptom: "The button still says Register interest and never offers a trial",
        meaning:
          "You are looking at Workshop, Depot, Haulier or Network with no promo code in the address bar. Those plans are open to code holders only, so without one their buttons stay as enquiry links rather than becoming buy buttons. Operator does not need a code: its button starts checkout on its own, with no trial.",
        fix: "Use the full link you were given, including the ?promo= part, rather than typing fleetlix.com by hand. If you have a code but no link, email us and we will send you one.",
      },
  // PAUSED_ERROR in functions/api/checkout.ts, verbatim.
  ...(SALES_PAUSED
    ? [
        {
          kind: "message",
          symptom: "New subscriptions are paused for now.",
          meaning:
            "You pressed a buy button on a page that was opened before sign-up was paused. Nothing was charged: the payment page never opened.",
          fix: "Reload the page. The button becomes an enquiry link, and registering your interest is how to hear when sign-up reopens.",
        } satisfies CheckoutIssue,
      ]
    : []),
  {
    kind: "message",
    symptom: "This checkout requires a valid promo code.",
    meaning:
      "The code reached us but we did not recognise it. Codes are not case-sensitive and stray spaces are ignored, so this almost always means a mistyped or expired code rather than a formatting problem.",
    fix: "Check the code against the card or email it came from. If it looks right, send us the exact link you used and we will tell you what we received.",
  },
  {
    kind: "message",
    symptom: "That plan isn't available for checkout yet.",
    meaning:
      "That tier is not yet wired to a price in our payment system. It is a gap at our end, not a problem with your card or your code.",
    fix: "Email us with the plan name and we will either open it or take your signup manually.",
  },
  {
    kind: "message",
    symptom: "Annual billing isn't available for that plan yet.",
    meaning:
      "The same gap, specific to the yearly price. The monthly price for that tier may still work.",
    fix: "Switch the billing toggle to monthly to get started, and tell us you want annual — we will move you across and credit what you have paid.",
  },
  {
    kind: "message",
    symptom: "Checkout isn't available yet.",
    meaning: "Paid signup is switched off at our end entirely.",
    fix: "Nothing you can do from your side. Email us and we will tell you when it is back, or take the signup another way.",
  },
  {
    kind: "message",
    symptom: "Couldn't start checkout. Try again shortly.",
    meaning:
      "We reached our payment provider and it declined to open a session. Usually momentary. Nothing has been charged — a session that never opened cannot take money.",
    fix: "Wait a minute and press the button again. If it happens twice, stop and email us rather than retrying repeatedly, and tell us which plan and which billing period.",
  },
  {
    kind: "message",
    symptom: "Network error — try again",
    meaning:
      "The request never left your device or never came back. A connection problem, not a payment one.",
    fix: "Check the connection and retry. On a yard tablet on patchy signal, try again from a desk.",
  },
  {
    kind: "behaviour",
    symptom: "The card was declined on the payment page",
    meaning:
      "That decision is your bank's and we are not told why. We never see your card number, so we cannot check it for you.",
    fix: "Try another card, or call the number on the back of yours — business cards are often blocked on a first online subscription. On a plan with a free trial, we take card details even though nothing is charged that day.",
  },
  {
    kind: "behaviour",
    symptom: "I paid, but I never got to set a password",
    meaning:
      "The confirmation link carries a one-time reference that proves the payment. If the tab was closed too early, or the link was shortened or forwarded and lost part of itself, the sign-up page cannot confirm who you are and drops you at the ordinary sign-in screen.",
    fix: "Do not pay again. Email us from the address you paid with and we will finish the account by hand, usually the same day. Your payment is safe and we can see it.",
  },
];

/* ------------------------------------------------------------------ *
 * In-app problems. Deliberately does NOT duplicate the install guide's
 * troubleshooting list — install and PWA questions are answered at
 * /install, and this section links there rather than forking it.
 * ------------------------------------------------------------------ */

export interface AppIssue {
  symptom: string;
  fix: string;
}

export const appIssues: AppIssue[] = [
  {
    symptom: "I can't sign in",
    fix: "Use the password reset on the sign-in screen first — it is faster than we are. If the reset email does not arrive within a few minutes, check the spam folder, then email us and we will confirm which address the account is actually under. Note that we cannot see your password and will never ask you for it.",
  },
  {
    symptom: "Someone I invited never got their email",
    fix: "Invitations land in spam more often than they should, particularly on shared office addresses. Check there first, then resend from the team screen. If a second attempt fails, the address is probably rejecting us — send us the address and we will tell you what happened to the message.",
  },
  {
    symptom: "A driver's jobs look out of date",
    fix: "Fleetlix keeps working without signal and syncs when it returns, so a device that has been out of coverage shows what it last knew. Opening the app on a connection resolves it. If a job stays stale after that, tell us the vehicle and roughly when, and we can look at what reached us.",
  },
  {
    symptom: "The app won't install, or it opens with an address bar",
    fix: "That is covered properly in the install guide, per device — including the platforms where it does not work and what to use instead.",
  },
  {
    symptom: "A waste movement was rejected by Digital Waste Tracking",
    fix: "The rejection reason comes back from the service itself and is shown against the movement. Most are a missing or malformed field on the record rather than anything to do with your credentials. Send us the movement reference if the reason is not clear and we will read it with you.",
  },
  {
    symptom: "I've run out of seats",
    fix: "Seat limits are enforced in the database rather than only in the interface, so the next person genuinely cannot be added. Either free a seat by removing someone who has left, or move up a tier — see section 9, which covers what changes and when you are charged.",
  },
];
