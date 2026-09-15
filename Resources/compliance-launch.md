# Fleetlix Compliance marketing integration

Prepared 14 September 2026 from the supplied build handover. Updated
15 September 2026 when signup opened.

The owner's clarification supersedes the handover's introductory pricing:
Compliance is a standalone portal at £49/month + VAT, with no introductory
period, scheduled price increase or relationship to the £99 Operator plan.
The £99 entry price elsewhere still describes the operations platform.
The portal price lives in `src/config/compliance.ts`.

## Status: open for assisted signup (15 September 2026)

The card reads **Available now**. Its CTA links to `#register-compliance`, which
lands on the homepage form with **Fleetlix Compliance** preselected. That
submission is stamped `enquiry_type: "compliance"`, asks for waste movements per
month instead of fleet size, and reaches the inbox as `Fleetlix COMPLIANCE`.
Each account is then set up by hand, as item 8 of the app handover expects. The
site promises a reply within one working day, which is the same commitment
`/support` already makes.

There is still **no checkout slug, no checkout hook, no annual price and no
purchasable structured-data offer** for this tier.

### Why not self-serve checkout yet

Checked against the app repository's `main` on 15 September 2026:

1. **The app cannot provision a Compliance tenant from a website checkout.**
   `functions/api/onboarding/provision.ts` resolves the plan with `isPlanName()`,
   which only knows the five carrier plans, then falls back to
   `STRIPE_PRICE_MAP`, where the Compliance price deliberately is not. A
   `plan=compliance` session therefore returns 422, "This checkout has no valid
   plan", after the buyer has already given their card to Stripe.
2. **The app's own `/api/billing/compliance-checkout` is admin-gated.** It
   bills a tenant that already exists (the hand-provisioned route), not a new
   signup.
3. **That checkout does not appear to collect terms acceptance.** No
   `consent_collection` was found in `functions/api/billing/_lib/complianceBilling.ts`.
   Section 2 of `/terms-of-service` says acceptance is a required tick box at
   Stripe Checkout. Resolve this before the first Compliance customer is
   charged, or record acceptance another way.

### Decisions already made for when checkout opens

- **Anyone can buy, no promo code.** This needs the promo gate in
  `functions/api/checkout.ts` relaxed for this slug (or a separate endpoint),
  and the "Paid signup is invitation-only" callout on `/support` rewording.
- **No free trial.** This matches the app, which sends no
  `subscription_data[trial_period_days]` for this price.
- **Monthly only.** The price is found by lookup key
  `fleetlix_compliance_monthly_gbp`. It must never go into `STRIPE_PRICE_MAP`,
  because the app's `parsePriceMap()` throws on a non-carrier entry and 503s
  every carrier checkout.

## App-side launch gates

From the app repository's `Resources/49-dwts-portal-handover.md` §7. The
marketing implementation does not verify or complete these.

1. **Outstanding.** M0: flip production DWTS and file one real movement;
   confirm each nation's receiving-site obligation with the relevant regulator.
   The handover calls this a blocker for going live.
2. **Done 15 Sep 2026.** Migrations 228–230 applied to staging, then live.
3. **Outstanding.** Verify the seeded bank holidays before enabling a nation's
   deadline logic.
4. **Live price done 15 Sep 2026** (`prod_VGNCeeldr2o1bP`, made in the
   Dashboard). **No sandbox price yet**, so a test-mode run is not possible.
5. **Outstanding.** Resolve the submission-liability terms and keep
   contractual/support copy aligned.
6. **Outstanding.** Decide whether the allowance counts jobs or transfer notes.
   The card calls 100 submissions a planned allowance until that is decided.
7. **Outstanding.** Exercise the actual app and record form in a browser at 375px.
8. **In use.** Provision accounts by hand. Self-serve signup needs the app
   work described above.

No AI, automatic filing, automated carrier-register lookup, unlimited allowance,
or specific Northern Ireland obligation date is advertised for this tier.
