# Fleetlix Compliance marketing integration

Prepared 14 September 2026 from the supplied build handover. Updated
15 September 2026, first for assisted signup, then for self-serve checkout.

The owner's clarification supersedes the handover's introductory pricing:
Compliance is a standalone portal at £49/month + VAT, with no introductory
period, scheduled price increase or relationship to the £99 Operator plan.
The £99 entry price elsewhere still describes the operations platform.
The portal price lives in `src/config/compliance.ts`.

## Status: self-serve checkout (15 September 2026)

**Start Fleetlix Compliance → Stripe → welcome screen → create login → records.**

1. The card's CTA is `[data-open-checkout] data-plan="compliance"`.
   `src/scripts/checkout.ts` posts `{plan:"compliance"}` to `/api/checkout`.
2. `functions/api/checkout.ts` finds the price by lookup key
   `fleetlix_compliance_monthly_gbp`. It refuses to sell unless there is exactly
   one active price, and that price is 4900 GBP, tax-exclusive and billed every
   one month. Anyone can buy (no promo code). There is no trial. It collects
   billing address, VAT number and the terms-of-service tick box.
3. Stripe returns to `/thank-you?session_id=…&plan=compliance`, which shows the
   order (£49 + VAT, taken today) and the three Compliance next steps.
4. "Create your login" opens `fleetlix.app/onboarding?session_id=…`. The app's
   `provision.ts` accepts the session only when `metadata.plan` is `compliance`
   **and** the billed price is the monthly Compliance price. It creates:
   - a `compliance` tenant: `business_type='compliance'`, plus the columns from
     `complianceEntitlementPatch()` — the same ones the webhook writes;
   - a top-admin login, signed straight in, landing on `/compliance`, where the
     first-run Compliance tour runs.
5. The existing webhook path (`handleComplianceSubscriptionEvent`) keeps the
   account in step afterwards. Cancellation puts records under legal hold; it
   never floors the plan.

The homepage form's Compliance option stays, but for questions rather than
signup. With JS off, the card's CTA falls back to it.

### Decisions this follows

- **Anyone can buy, no promo code.**
- **No free trial.** This matches the app, which never sends
  `subscription_data[trial_period_days]` for this price.
- **Monthly only.** The price is never in `STRIPE_PRICE_MAP`: the app's
  `parsePriceMap()` throws on a non-carrier entry and 503s every carrier
  checkout.

## Before this takes a real customer's money

1. **Deploy the app first** (branch `feat/broker-pro-checkout`, which also
   carries Broker Pro). Until then a buyer pays and hits "This checkout has no
   valid plan" on `/onboarding`.
2. **Create the test-mode price** and walk the whole path with `4242 4242 4242
   4242`. As of 15 Sep 2026 only the live price exists (`price_1UFqRv…` on
   `prod_VGNCeeldr2o1bP`). The app's `node scripts/stripe/seed-catalog.mjs`
   dry-runs in test mode by default; `--apply` creates it.
3. **An existing Compliance customer set up by hand** who buys here would be
   told their email already has an account. Point them to Plan & billing in the
   app instead.

## App-side launch gates

From the app repository's `Resources/49-dwts-portal-handover.md` §7. The
marketing implementation does not verify or complete these.

1. **Outstanding.** M0: flip production DWTS and file one real movement;
   confirm each nation's receiving-site obligation with the relevant regulator.
   The handover calls this a blocker for going live.
2. **Done 15 Sep 2026.** Migrations 228–230 applied to staging, then live.
3. **Outstanding.** Verify the seeded bank holidays before enabling a nation's
   deadline logic.
4. **Live price done 15 Sep 2026.** Test-mode price not yet created.
5. **Outstanding.** Resolve the submission-liability terms and keep
   contractual/support copy aligned.
6. **Outstanding.** Decide whether the allowance counts jobs or transfer notes.
   The card calls 100 submissions a planned allowance until that is decided.
7. **Outstanding.** Exercise the actual app and record form in a browser at 375px.
8. **Built, not yet deployed.** Self-serve provisioning, described above.

No AI, automatic filing, automated carrier-register lookup, unlimited allowance,
or specific Northern Ireland obligation date is advertised for this tier.
