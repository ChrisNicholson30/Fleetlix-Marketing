// Owner clarification supersedes the handover's introductory pricing:
// standalone portal at £49/month + VAT, with no step-up to Operator.
// Open for ASSISTED signup since 15 Sep 2026: the card's CTA goes to the
// Compliance enquiry on the homepage form and accounts are set up by hand.
// This is a DWTS-only product, not a checkout PlanSlug or an operations Tier —
// the app's provisioner cannot create a Compliance tenant from a website
// checkout yet. Read Resources/compliance-launch.md before adding checkout hooks.
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
