// The post-payment welcome screen (/thank-you) — the third step of paid signup:
//
//   pricing card → Stripe Checkout → THIS SCREEN → fleetlix.app/onboarding
//
// It exists because Stripe hands back a paid session and nothing else. The
// buyer has just been charged (or started a trial) on a page that isn't ours,
// and the two things they need next — confirmation of what they bought, and the
// door into the app — live in two different systems. This screen is the join.
//
// Everything tabular lives here; the prose lives in the page, same split as
// src/config/support.ts and src/config/security.ts.

/**
 * Where the app lives. The handoff is a cross-origin link rather than a
 * redirect so the buyer keeps a receipt page they can go back to — the app is
 * a separate deploy and can be mid-rollout when they land.
 */
export const APP_ORIGIN = "https://fleetlix.app";

/**
 * The app's paid-signup entry point. It takes ?session_id= and uses it to
 * confirm the payment and provision the tenant, so the id is a capability, not
 * decoration — dropping it leaves the buyer at a sign-in screen for an account
 * that doesn't exist yet. Mirrors the ^cs_[A-Za-z0-9_]+$ check in the app's
 * provision function.
 */
export const ONBOARDING_PATH = "/onboarding";

/**
 * What happens after they leave this page. Three steps, because that is how
 * many the app actually has — do not pad this to five to make the page look
 * substantial. Each `owner` says which system the step happens in, so nobody
 * goes looking for step 2 on the marketing site.
 */
export const ONBOARDING_STEPS: {
  title: string;
  body: string;
  owner: "app" | "you";
}[] = [
  {
    title: "Create your login",
    body:
      "Set a password and confirm your details. Your subscription is already paid for — this links it to the person who will run it.",
    owner: "app",
  },
  {
    title: "Set your operation up",
    body:
      "Add your depots, vehicles and drivers. If you are coming off a spreadsheet or another system, the migration tool imports them in bulk rather than one at a time.",
    owner: "app",
  },
  {
    title: "Bring your team on",
    body:
      "Invite drivers, yard and office staff up to your plan's seat limits, then install Fleetlix on their phones. Drivers only need the install guide and their invite.",
    owner: "you",
  },
];

/**
 * The same three-step promise for a Broker Pro buyer. A broker has no depots,
 * vehicles or drivers, so the operations steps would send them looking for
 * screens their account deliberately does not have.
 */
export const BROKER_ONBOARDING_STEPS: typeof ONBOARDING_STEPS = [
  {
    title: "Create your login",
    body:
      "Set a password. Your Broker Pro subscription is already paid for, so this signs you straight in to the broker desk.",
    owner: "app",
  },
  {
    title: "Connect your carriers",
    body:
      "Invite the carriers you already use. Each one accepts under their own account, and your margin stays invisible to them.",
    owner: "app",
  },
  {
    title: "Pass your first job",
    body:
      "Send a job to a connected carrier and watch the status, proof of delivery and waste transfer note come back to you.",
    owner: "you",
  },
];

/**
 * The three steps for a Fleetlix Compliance buyer. It lands on the records list
 * with a three-step first-run tour, so these match what that screen shows
 * rather than inventing a setup the tier does not have.
 */
export const COMPLIANCE_ONBOARDING_STEPS: typeof ONBOARDING_STEPS = [
  {
    title: "Create your login",
    body:
      "Set a password. Your Fleetlix Compliance subscription is already paid for, so this signs you straight in to your records.",
    owner: "app",
  },
  {
    title: "Record your first load",
    body:
      "Who brought it, when it landed and what was in it. The form checks each field and the EWC code as you go, and shows the filing deadline.",
    owner: "app",
  },
  {
    title: "Confirm the submission",
    body:
      "Nothing files itself. Each record waits for you to confirm it, and the outstanding list shows what is still owed and how long you have.",
    owner: "you",
  },
];

/**
 * The preview payload behind ?demo= on the welcome screen. It is here rather
 * than in the script so the numbers sit beside the real ones and can be checked
 * against src/config/pricing.ts at a glance.
 *
 * This is a DESIGN AND COPY harness, not a test of the payment path — it never
 * calls Stripe. Use it to look at the screen; use a real test-mode checkout
 * (TEST_STRIPE_SECRET_KEY) to test that the flow works.
 */
export const DEMO_SUMMARY = {
  status: "complete",
  // Not "test": that badge means "a real Stripe session ran in test mode", and
  // this one never touched Stripe at all. Two different claims, two strips.
  mode: "preview",
  plan: "operator",
  promo: "letsrecycle",
  interval: "month",
  email: "you@example.com",
  amount: 9900,
  currency: "GBP",
  /** Days from now, so the preview never shows a date in the past. */
  trialInDays: 14,
} as const;
