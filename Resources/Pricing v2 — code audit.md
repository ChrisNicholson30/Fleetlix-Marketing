# Pricing v2 — code audit

#fleetlix #pricing #audit

> [!DONE] Actioned on the marketing site, 10 August 2026.
> Every card-facing item (fix list 1–5, 7–9) is fixed in `src/config/pricing.ts`
> and `PricingSection.astro`; the rewritten ladder and the reasoning are recorded
> in [[fleetlix-pricing-v2]] under _Feature gates_. Decisions taken on the three
> open questions:
>
> - **Unbuilt capability** (subcontractor logins + auto-PO, two-way Xero/QB, SSO)
>   → kept on the cards but moved to a dated, visually separate **Coming December
>   2026** block. `coming[]` in `pricing.ts`, dashed border, hollow markers, never
>   a tick.
> - **Network** → repositioned **capacity-led**. With zero network-only gates
>   beyond `bi: drill_down`, headroom is what the tier sells and the card now
>   says so instead of listing three things Haulier already has.
> - **Operator's 5-vs-3 seats** → **the card is right, the database catches up.**
>   The published matrix is the v2 spec and there are no tenants yet. Item 1 is
>   therefore still open, as an app-repo change, and it is launch-blocking —
>   tracked in [[fleetlix-pricing-v2]] under _Application changes_.
>
> **Still open — all app-repo, none of it fixable from the marketing site:**
> item 1 (seat caps), item 6 (`PLAN_META` still on the v1 ladder, so internal MRR
> understates by 20–25%), and the hygiene items 10–13. The routing family (§3) was
> resolved the way this document recommends — the card was fixed, not the code —
> so the `routing` row remains dead config and should be deleted or wired up.

**Audit date:** 2026-08-10 · **Audited against:** `Resources/Pricing/fleetlix-pricing-v2.md` (the five-tier £99/£219/£419/£675/£949 ladder) · **Method:** static read of `shared/plans/index.ts`, every `hasModule`/`moduleAtLeast`/`moduleLevel` call site in `app/src` + `functions/` + `shared/`, the seat-limit triggers in migrations 030/062/064, and the one SQL plan gate in migration 100. The app was **not run**; this is a source audit, so "enforced" means a gate exists in code, not that it has been exercised in a browser.

**Headline:** 5 of the 21 published feature bullets are safe to print as-is. **4 describe capability every tier already has**, **4 describe capability that does not exist yet**, and **3 published seat/volume numbers are contradicted by the database.** Three genuinely-gated, saleable capabilities are missing from the card entirely.

---

## 1. The enforcement map

`shared/plans/index.ts` holds an 11-module × 5-tier matrix. What matters commercially is which cells anything actually reads.

| Module                | Ladder in the matrix                                         | Enforced?                                                                     | Where                                                                                                                                 |
| --------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `dwts`                | submit ×4 → `submit_high_volume`                             | Capability: ungated **by design** (compliance floor). Volume: **not metered** | —                                                                                                                                     |
| `billing`             | basic → branded → bulk → self_bill → all                     | **`branded` only**                                                            | `InvoiceDocument.tsx:134`                                                                                                             |
| `portal`              | — → read_only → recycling_co2 → portal_booking → white_label | 3 of 4 levels; `portal_booking` gated **twice** (UI + SQL)                    | `CustomersPanel.tsx:1373,1455` · `functions/api/users.ts:468` · `PortalHome.tsx:103,109` · `100_portal_book_job.sql:63`               |
| `cart`                | register → basic → paid → multi_service → all                | **Nothing. Zero call sites.**                                                 | —                                                                                                                                     |
| `brokerage`           | — → — → margin → auto_po_subbie → all                        | Boolean (Depot+) only; levels unenforced                                      | `PartnershipsPanel.tsx:41` · `OffersPanel.tsx:62` · `OpsHome.tsx:134`                                                                 |
| `routing`             | — → — → basic → map_optimise → multi_depot                   | **Nothing. Zero call sites.**                                                 | —                                                                                                                                     |
| `bi`                  | — → counts → per_role → custom → drill_down                  | **All four levels** ✅                                                        | `OpsHome.tsx:121` · `ReportsPanel.tsx:76–80`                                                                                          |
| `crm`                 | — → contacts → opportunities → pipeline_tasks → all          | **All three levels** ✅                                                       | `CrmPanel.tsx:56–58` · `OpsHome.tsx:122`                                                                                              |
| `accounting`          | — → — → xero_one_way → xero_two_way_qb → all_sso             | Boolean (Depot+) only                                                         | `InvoicesPanel.tsx:81`                                                                                                                |
| `weight_pricing`      | — → — → tonnage ×3                                           | ✅ Enforced — **absent from the card**                                        | `JobConsoleDrawer.tsx:111`                                                                                                            |
| `commercial_accounts` | — → — → credit → multi_site ×2                               | ✅ Both levels, 9 call sites — **absent from the card**                       | `CustomersPanel.tsx:80,82,1375` · `JobForm.tsx:80,83` · `InvoicesPanel.tsx:83,386` · `LoadIssuesPanel.tsx:40` · `ReportsPanel.tsx:84` |

`bi` and `crm` are the model to copy: every published step corresponds to a real branch in the code.

---

## 2. Card bullets, line by line

Legend: ✅ safe to print · ⚠️ true but misleading as worded · ❌ not true today

### Operator (£99)

| Bullet                     | Verdict | Detail                                                                                                                                            |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full operations core       | ✅      | True, and **understated** — this silently includes the drag-and-drop dispatch board (see §3).                                                     |
| DWTS compliance submission | ✅      | Correct. Deliberately ungated — the capability is the floor for every tier.                                                                       |
| Basic invoicing            | ✅      | Correct. `billing: 'basic'`, and branding is genuinely withheld until Workshop.                                                                   |
| Register-interest bookings | ❌      | The `cart` module has **no gate anywhere**. An Operator tenant is not restricted to register-interest; the full booking widget resolves for them. |

### Workshop (£219) — everything in Operator, plus

| Bullet                    | Verdict | Detail                                                                                             |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| Branded invoice PDFs      | ✅      | The single cleanest claim on the card — one gate, one level, correct tier.                         |
| Read-only customer portal | ✅      | Enforced client-side **and** server-side (`functions/api/users.ts:468` refuses the portal invite). |
| Basic online cart         | ❌      | `cart` is ungated. No "basic vs paid" distinction exists in code.                                  |
| CRM contacts              | ✅      | Enforced.                                                                                          |
| Basic BI counts           | ✅      | Enforced.                                                                                          |

### Depot (£419) — everything in Workshop, plus

| Bullet                    | Verdict | Detail                                                                                                                                                                                                                         |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Paid online cart          | ❌      | Ungated. Mitigating factor: paid checkout needs Stripe Connect and **no tenant has it active**, so it is dormant for everyone — but dormant equally, not by tier.                                                              |
| Brokerage margin tracking | ✅      | Enforced (boolean). Minor leak: `OpsHome.tsx:134` shows the Offers tab on `hasModule(...) \|\| offersUnread > 0`, so a lower tier that _receives_ an offer sees the tab. Sending is properly gated.                            |
| Drag-and-drop routing     | ❌      | **Free at every tier.** See §3 — this is the biggest single defect.                                                                                                                                                            |
| Per-role dashboards       | ✅      | Enforced.                                                                                                                                                                                                                      |
| Recycling & CO₂ portal    | ✅      | Enforced.                                                                                                                                                                                                                      |
| Xero sync (1-way)         | ⚠️⚠️    | Wrong twice. (a) It is a **CSV export, not a sync** — `shared/accounting/index.ts:3–7` states the no-OAuth path explicitly. (b) The gate is one boolean, so Depot already gets the **QuickBooks** CSV that Haulier is sold on. |

**Missing from Depot** — three capabilities that _are_ enforced at Depot+ and are not advertised:

- **Weight & tonnage pricing** (`weight_pricing`) — weigh-and-charge job pricing.
- **Credit accounts** (`commercial_accounts: 'credit'`) — credit limits and live exposure, payment terms driving invoice due dates, PO enforcement, account lifecycle, site access windows. Nine enforcement sites; the most thoroughly gated module in the codebase.
- **CRM pipeline** (`crm: 'opportunities'`) — currently implied to be a Haulier feature.

### Haulier (£675) — everything in Depot, plus

| Bullet                         | Verdict | Detail                                                                                                                                                                                               |
| ------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Map route optimisation         | ❌      | `optimiseRoute` is called unconditionally at `DispatchBoard.tsx:235`. Free at every tier.                                                                                                            |
| Subcontractor logins + auto-PO | ❌      | **Unbuilt.** `jobs.is_subcontractor` / `subcontractor_name` exist and render as a read-only row (`JobConsoleDrawer.tsx:318`). There is no subcontractor login path and no PO generation of any kind. |
| Booking from the portal        | ✅✅    | The strongest claim on the card — gated in the UI _and_ backstopped in SQL (`100_portal_book_job.sql:63` raises for any plan outside haulier/network).                                               |
| Custom dashboards              | ✅      | Enforced (`customUnlocked`, custom period range).                                                                                                                                                    |
| CRM pipeline & tasks           | ⚠️      | Half true. The **pipeline** unlocks at Depot; only **tasks** is Haulier. As worded it undersells Depot and oversells Haulier.                                                                        |
| 2-way Xero + QuickBooks        | ❌      | **Unbuilt.** `shared/accounting/index.ts:5–7` names the two-way path as not implemented (needs per-tenant OAuth apps and a token store). Both formats today are one-way CSVs available from Depot.   |

### Network (£949) — everything in Haulier, plus

| Bullet                  | Verdict | Detail                                                                                                                                |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Multi-depot routing     | ❌      | Built (migration 165) but **ungated** — it self-hides below two sites rather than checking the plan. Any tier with two sites gets it. |
| BI drill-down           | ✅      | Enforced (`drilldownUnlocked`).                                                                                                       |
| Higher DWTS volume      | ❌      | No counter exists anywhere. `submit_high_volume` has zero call sites; **all five published DWTS/mo figures are decorative.**          |
| SSO (Google, Microsoft) | ❌      | **Unbuilt.** No OAuth or SAML path exists in the codebase.                                                                            |

---

## 3. The routing family — one root cause, three bad bullets

Depot's "drag-and-drop routing", Haulier's "map route optimisation" and Network's "multi-depot routing" are all unenforced, for the same historical reason.

Migration `078_routing_rounds` built a separate Depot-gated **Rounds** surface, with the drag-and-drop board staying core beneath it. That is what these bullets were written against. Migration `079_remove_rounds` then deleted Rounds as redundant with the board. The board stayed core and ungated; the pricing lines survived the deletion. The `routing` row at `shared/plans/index.ts:70` is now dead config that nothing reads.

**Recommendation: fix the card, not the code.** Gating the board would leave an Operator planning from a flat job list with no driver lanes and no day view — which is not a "full operations core", and migration 079 deliberately made the board the single dispatch surface for every tier.

Concretely:

- Promote **drag-and-drop dispatch board** into Operator's core bullets. At £99 it is the reason a sole trader buys, and it is currently invisible on the card.
- Replace Depot's routing line with **weight & tonnage pricing** and **credit accounts** — both real, both enforced, both stronger Depot signals.
- Haulier's map-optimisation line is the one open decision: either wire `moduleAtLeast(plan,'routing','map_optimise')` around the optimiser button (a genuine gate, one call site) or drop the line. Same choice for Network's multi-depot.

---

## 4. Seat caps — the database disagrees with the card

The doc states "Caps stay enforced in the database, not just the UI." That is true for three pools and false for two.

**Only three caps exist:** `seat_limit` (total), `driver_limit`, `maintenance_limit`, enforced by the `private.enforce_seat_limit` trigger (migrations 030/064). **There is no `yard_limit` and no `office_limit` column.** So publishing Yard and Office as named pools with hard numbers implies four enforced caps where two of them are unenforceable today.

Published numbers vs `PLAN_META` (`shared/plans/index.ts:37–41`):

| Tier     | Total published | `seat_limit` | Drivers published | `driver_limit` | Mechanics published | `maintenance_limit` |
| -------- | --------------- | ------------ | ----------------- | -------------- | ------------------- | ------------------- |
| Operator | 5               | **3** ⚠️     | 2                 | 2 ✅           | 1                   | 1 ✅                |
| Workshop | 16              | 12           | 8                 | 8 ✅           | 3                   | 4                   |
| Depot    | 39              | 40           | 20                | 30             | 6                   | 8                   |
| Haulier  | 92              | 120          | 50                | 90             | 12                  | 15                  |
| Network  | Unlimited       | **500** ⚠️   | Unlimited         | **400** ⚠️     | Unlimited           | **40** ⚠️           |

Two of these are promises the database will actively break:

- **Operator publishes 5 total seats; the trigger refuses the 4th.** A buyer adding their fourth login gets a hard `SEAT_LIMIT: account is at its plan limit of 3 users`. This is the most urgent item in the audit — it is an over-promise enforced by a raise, on the entry tier, at the moment of setup.
- **Network publishes "Unlimited" four times; the trigger refuses at 500 users / 400 drivers / 40 mechanics.** Defensible in practice (no customer will reach 400 drivers) but it is not what "Unlimited" means, and it is the tier carrying a £499 onboarding fee.

Everywhere else the published figure is _below_ the enforced one (Depot 20 vs 30 drivers, Haulier 50 vs 90), which is safe — the card under-promises. Either way, `PLAN_META` and the `set_tenant_plan` limits need reconciling to the published matrix before launch, in the same edit.

---

## 5. Prices in code are the superseded ladder

`PLAN_META` still holds **£79 / £189 / £350 / £550 / £899** — precisely the ladder this document supersedes. There is no annual price field and no onboarding-fee field.

This is not cosmetic: the `/fleetlix` internal console computes MRR from `PLAN_META`, so from the moment v2 goes live **Fleetlix's own revenue reporting understates every tenant by 20–25%** until this is updated.

Also worth marketing knowing: since migration 174, a tenant admin **cannot change their own plan** — `set_tenant_plan` is platform-admin only. Any copy implying self-serve instant upgrade/downgrade is currently wrong; a tier change is a Fleetlix-side action until Stripe billing lands.

---

## 6. One structural warning about the governing rule

The doc proposes promoting this to the top of the pricing section:

> Depot unlocks each module's core version. Haulier unlocks its power version.

It holds for 5 of 11 modules (`brokerage`, `routing`, `accounting`, `weight_pricing`, `commercial_accounts`) and is false for the other 6, whose cores start at Operator or Workshop: `billing` (basic@Operator), `portal` (read_only@Workshop), `cart` (register@Operator), `bi` (counts@Workshop), `crm` (contacts@Workshop), `dwts` (all tiers).

As a footnote it is a useful rule of thumb. As a promoted headline it becomes a claim a buyer can disprove from the same card — Workshop visibly has portal, CRM and BI cores. Suggest rewording to something like _"Depot unlocks the commercial modules; Haulier unlocks their power versions."_

---

## 7. Fix list, ordered by exposure

**Before the card ships:**

1. Operator's published seat total (5) vs enforced (3) — fix one or the other. Hard failure at setup.
2. Remove or rewrite the 4 unbuilt bullets: subcontractor logins + auto-PO, 2-way Xero + QuickBooks, SSO, higher DWTS volume.
3. Rewrite the 3 routing bullets per §3.
4. Reword "Xero sync (1-way)" → an export, and stop selling QuickBooks as Haulier-only.
5. Soften Network "Unlimited" or raise the DB caps to match.

**Before Stripe prices are created (they are immutable):** 6. Update `PLAN_META` prices to the v2 ladder, or accept wrong internal MRR.

**Card improvements available for free:** 7. Name the drag-and-drop dispatch board under Operator. 8. Add weight/tonnage pricing and credit accounts to Depot — both already enforced, currently given away silently. 9. Move CRM pipeline to Depot, leave tasks at Haulier.

**Code hygiene (not marketing's problem, but related):** 10. `cart` has four published levels and zero gates. 11. The Offers tab leaks to lower tiers on unread offers (`OpsHome.tsx:134`). 12. The portal already wears the operator's brand at every tier (migration 183) — `portal: network 'white_label'` is unadvertised and already given away, so there is nothing left to sell there without a rethink. 13. The accounting export hard-codes VAT at 20% and ignores per-line VAT rates (migration 182 added those), so a mixed-rate invoice exports wrong. Relevant if any copy promises accounting accuracy.
