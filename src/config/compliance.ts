// Owner clarification supersedes the handover's introductory pricing:
// standalone portal at £49/month + VAT, with no step-up to Operator.
// SELF-SERVE since 15 Sep 2026: the card's CTA is an open checkout
// (plan slug `compliance`, no promo, no trial, monthly) → /thank-you →
// fleetlix.app/onboarding, which provisions a `compliance` tenant. It is not an
// operations Tier: it has its own price, found by lookup key, and its own
// tenant type in the app. See Resources/compliance-launch.md.
export const COMPLIANCE = {
  name: "Fleetlix Compliance",
  monthly: 49,
  users: 2,
  submissions: 100,
  features: [
    "One form to record each waste movement",
    "Field checks, EWC validation and anomaly warnings",
    "You confirm every submission — nothing files itself",
    "A filing deadline shown on every record",
    "Spreadsheet export of your records, any time",
    "A read-only tracking link for your customer",
  ],
} as const;
