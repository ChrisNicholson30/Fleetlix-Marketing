// Owner clarification supersedes the handover's introductory pricing:
// standalone portal at £49/month + VAT, with no step-up to Operator.
// This is an upcoming DWTS-only
// product, not a checkout PlanSlug or an operations Tier. Keep it out of
// purchasable offers until the launch gates in Resources/compliance-launch.md pass.
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
