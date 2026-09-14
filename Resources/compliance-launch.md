# Fleetlix Compliance marketing integration

Prepared 14 September 2026 from the supplied build handover.

The owner's clarification supersedes the handover's introductory pricing:
Compliance is a standalone portal at £49/month + VAT, with no introductory
period, scheduled price increase or relationship to the £99 Operator plan.

The standalone DWTS portal appears before the separate operations plans,
explicitly marked Coming soon. Its CTA registers interest; it has no checkout
hooks, checkout slug, annual price or purchasable structured-data offer.
The £99 entry price elsewhere still describes the operations platform.
The portal price lives in `src/config/compliance.ts`.

Before changing the card to available or enabling payment:

1. Complete M0: production DWTS switch and one real movement; confirm each
   nation's receiving-site obligation with the relevant regulator.
2. Apply migrations 228–230 in order, staging then production, run the
   rolled-back verifiers and regenerate database types in the app repository.
3. Verify the seeded bank holidays before enabling a nation's deadline logic.
4. Create and verify standalone portal billing at £49/month + VAT. Align the
   app's account pricing with this correction; remove the handover's intro
   window, scheduled step-up and reminder before launch.
5. Resolve the submission-liability terms and keep contractual/support copy aligned.
6. Decide whether the allowance counts jobs or transfer notes. The card calls
   100 submissions a planned allowance until that decision is made.
7. Exercise the actual app and record form in a browser at 375px.
8. Provision the first assisted account. Self-serve signup needs separate app work.

No AI, automatic filing, automated carrier-register lookup, unlimited allowance,
or specific Northern Ireland obligation date is advertised for this tier.
The marketing implementation does not verify or complete the app launch gates.
