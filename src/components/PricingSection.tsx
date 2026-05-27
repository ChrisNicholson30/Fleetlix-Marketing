/** @jsxImportSource react */
import { useState } from "react";

type IconKey = keyof typeof ICONS;

const ICONS = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  warehouse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M9 21v-9h6v9" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2 18l3-12 5 6 2-8 2 8 5-6 3 12z" />
      <path d="M2 18h20" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  swap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M16 3l4 4-4 4" />
      <path d="M4 7h16" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M20 17H4" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  flag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 21V4" />
      <path d="M4 4h12l-2 4 2 4H4" />
    </svg>
  ),
} as const;

type Tier = {
  name: string;
  blurb: string;
  fleetSize: string;
  iconKey: IconKey;
  price: { monthly: number; annual: number } | null;
  setupFee?: string;
  ctaHref: string | { monthly: string; annual: string };
  ctaLabel: string;
  ctaStyle: "primary" | "outline" | "subtle";
  features: string[];
  popular: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Operator",
    blurb: "Sole trader, doing everything yourself.",
    fleetSize: "1–5 vehicles",
    iconKey: "user",
    price: { monthly: 79, annual: 66 },
    ctaHref: {
      monthly: "https://buy.stripe.com/bJe7sL5E85Qoc3Q2CH2oE01",
      annual: "https://buy.stripe.com/4gMdR97Mg0w41pc3GL2oE02",
    },
    ctaLabel: "Start free trial",
    ctaStyle: "outline",
    features: ["5 users", "250 jobs/month", "Driver + Office views", "Email support"],
    popular: false,
  },
  {
    name: "Workshop",
    blurb: "Small fleet with a yard and a mechanic.",
    fleetSize: "6–20 vehicles",
    iconKey: "tools",
    price: { monthly: 199, annual: 165 },
    ctaHref: {
      monthly: "https://buy.stripe.com/aFafZh7Mggv2ebYdhl2oE03",
      annual: "https://buy.stripe.com/9B65kDd6A2Ec9VI1yD2oE04",
    },
    ctaLabel: "Start free trial",
    ctaStyle: "outline",
    features: ["20 users", "1,500 jobs/month", "+ Yard + Broker views", "Defect reporting", "Admin portal", "Bulk actions & shortcuts"],
    popular: false,
  },
  {
    name: "Depot",
    blurb: "Full operation. Drivers, yard, office, maintenance.",
    fleetSize: "21–80 vehicles",
    iconKey: "warehouse",
    price: { monthly: 350, annual: 291 },
    ctaHref: {
      monthly: "https://buy.stripe.com/28EaEX6Ic1A89VI1yD2oE05",
      annual: "https://buy.stripe.com/28E28r7Mg3Ig9VI5OT2oE06",
    },
    ctaLabel: "Start free trial",
    ctaStyle: "primary",
    features: ["50 users", "5,000 jobs/month", "All roles + custom roles", "API access", "Custom branding", "Priority support"],
    popular: true,
  },
  {
    name: "Network",
    blurb: "Multi-site. Audit-ready. White-label.",
    fleetSize: "81+ vehicles",
    iconKey: "network",
    price: { monthly: 899, annual: 749 },
    setupFee: "+ £499 one-time onboarding",
    ctaHref: {
      monthly: "https://buy.stripe.com/bJedR90jO5Qoc3Qelp2oE07",
      annual: "https://buy.stripe.com/5kQ7sL1nS7YwebYb9d2oE08",
    },
    ctaLabel: "Start free trial",
    ctaStyle: "outline",
    features: ["Unlimited users", "Unlimited jobs", "SSO (Google, Microsoft)", "White-label domain", "SLA 99.9% uptime", "SOC 2 attestation", "Dedicated onboarding call"],
    popular: false,
  },
  {
    name: "Custom",
    blurb: "Bespoke contracts for large or regulated fleets.",
    fleetSize: "Talk to us",
    iconKey: "crown",
    price: null,
    ctaHref: "mailto:contact@fleetlix.com?subject=Custom%20enterprise%20pricing",
    ctaLabel: "Book a call",
    ctaStyle: "subtle",
    features: ["Custom contract terms", "On-prem or BYO cloud option", "Custom integrations (Reconomy, Xero, telematics)", "Named customer success manager", "Custom data residency"],
    popular: false,
  },
];

const INCLUDED = [
  "PDF docs (WTN, tickets)",
  "Apple MapKit lookup",
  "Walk-around checks",
  "UK data residency",
  "Offline-capable PWA",
  "DVSA-shaped records",
];

const TRUST: { iconKey: IconKey; label: string }[] = [
  { iconKey: "swap", label: "Change plan anytime" },
  { iconKey: "x", label: "Cancel anytime" },
  { iconKey: "card", label: "14-day free trial, card required" },
  { iconKey: "flag", label: "UK-built, UK-hosted" },
];

const billingBtnBase =
  "text-sm px-4 py-2 rounded-lg border bg-transparent text-white/80 font-medium transition cursor-pointer hover:text-white";
const billingBtnActive = "border-white/20 bg-white/10 text-white font-semibold";
const billingBtnInactive = "border-white/10";

function ctaClass(style: Tier["ctaStyle"]) {
  const base = "mt-5 block text-center text-sm font-semibold rounded-lg px-4 py-2.5 transition";
  if (style === "primary") return `${base} bg-[color:var(--color-cyan)] text-white hover:brightness-110`;
  if (style === "subtle") return `${base} bg-white/10 text-white border border-white/15 hover:bg-white/15`;
  return `${base} border border-white/20 text-white hover:bg-white/5`;
}

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="relative bg-[color:var(--color-graphite)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--color-amber)]">Pricing</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] font-extrabold text-3xl md:text-5xl tracking-tight">
            Built for fleets that move every day
          </h2>
          <p className="mt-4 text-white/70 text-lg">
            One platform. Drivers, yard, office, maintenance. Pick the tier that fits your operation today — change it whenever the operation changes.
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2" role="group" aria-label="Billing period">
          <button
            type="button"
            aria-pressed={billing === "monthly"}
            onClick={() => setBilling("monthly")}
            className={`${billingBtnBase} ${billing === "monthly" ? billingBtnActive : billingBtnInactive}`}
          >
            Monthly
          </button>
          <button
            type="button"
            aria-pressed={billing === "annual"}
            onClick={() => setBilling("annual")}
            className={`${billingBtnBase} ${billing === "annual" ? billingBtnActive : billingBtnInactive}`}
          >
            Annual
            <span className="ml-1 text-[color:var(--color-success)] font-semibold">−17%</span>
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-6 ${
                tier.popular
                  ? "bg-white/[0.06] border-2 border-[color:var(--color-cyan)]"
                  : "bg-white/[0.04] border border-white/10"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[color:var(--color-cyan)] text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Most popular
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-white/80">
                  {ICONS[tier.iconKey]}
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-white">{tier.name}</h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 pt-1.5 whitespace-nowrap">
                  {tier.fleetSize}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/60 min-h-[2.5rem]">{tier.blurb}</p>

              <div className="mt-5">
                {tier.price ? (
                  <>
                    <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl text-white">
                      £{billing === "annual" ? tier.price.annual : tier.price.monthly}
                    </span>
                    <span className="text-sm text-white/60 ml-1">/mo</span>
                    {tier.setupFee && (
                      <p className="mt-1 text-xs text-white/50">{tier.setupFee}</p>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl text-white">Talk</span>
                    <span className="text-sm text-white/60 ml-1">to us</span>
                  </>
                )}
              </div>

              <a
                href={typeof tier.ctaHref === "string" ? tier.ctaHref : tier.ctaHref[billing]}
                className={ctaClass(tier.ctaStyle)}
              >
                {tier.ctaLabel}
              </a>

              <ul className="mt-5 pt-5 border-t border-white/10 space-y-2 text-sm text-white/70">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-white/[0.04] border border-white/10 p-6">
          <p className="text-sm font-semibold text-white">In every tier</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {INCLUDED.map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-[color:var(--color-success)]">{ICONS.check}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 pt-6 border-t border-white/10 text-sm text-white/60">
          {TRUST.map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <span className="text-white/50">{ICONS[t.iconKey]}</span>
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
