---
title: Fleetlix — Pricing & Plans
status: reference
updated: 2026-07-06
source_of_truth: shared/plans/index.ts (PLAN_META + MODULE_MATRIX)
related: ["[[fleetlix-inhouse-build-plan]]", "[[Fleetlix-Plan-of-Action]]"]
---

# Fleetlix — Pricing & Plans

> Five plans, one product. Every plan runs the **full operations platform**; the
> plans differ by **team size (seats)** and which **commercial modules** are
> unlocked. Prices are per month, GBP.

## The five plans

| Plan         | Price / mo | Best for                             | Users | Drivers | Maintenance |
| ------------ | ---------: | ------------------------------------ | ----: | ------: | ----------: |
| **Operator** |    **£79** | Sole trader, doing everything        |     3 |       2 |           1 |
| **Workshop** |   **£189** | Small fleet — yard + mechanic        |    12 |       8 |           4 |
| **Depot**    |   **£350** | A full single operation              |    40 |      30 |           8 |
| **Haulier**  |   **£550** | The commercial operator              |   120 |      90 |          15 |
| **Network**  |   **£899** | Multi-site, white-label, audit-ready |   500 |     400 |          40 |

_"Users" is the total sign-in limit; **Drivers** and **Maintenance** are sub-limits
within it (e.g. Depot = up to 40 users, of which up to 30 drivers and 8 mechanics).
Seat limits are enforced in the database, not just the UI._

## Included in every plan — the operations core

No matter the tier, every account gets the whole operational platform:

- **Driver app** — DVSA walk-around checks (with offline capture + replay), today's run, job proof photos/signatures
- **Office & dispatch** — jobs + customers, the kanban dispatch board, live "Today" feed, live map of active drivers
- **Weighbridge** — weigh-in/out, tickets, waste capture
- **Waste Transfer Notes** — UK-compliant WTN PDFs, carrier sign-off
- **Maintenance** — work orders, parts, wheel-torque, vehicle register + VOR, fleet compliance dates
- **Team messaging**, public job tracking links, PWA install
- **DEFRA Digital Waste Tracking (DWTS)** — see the compliance note below

The table below is about the **commercial modules layered on top** of that core.

## What each plan unlocks — module matrix

| Module                         | Operator £79      | Workshop £189 | Depot £350          | Haulier £550                  | Network £899      |
| ------------------------------ | ----------------- | ------------- | ------------------- | ----------------------------- | ----------------- |
| **DWTS submission** (DEFRA)    | ✓                 | ✓             | ✓                   | ✓                             | ✓ (higher volume) |
| **Billing & invoicing**        | basic invoices    | + branded PDF | + bulk              | self-bill + supplier matching | all               |
| **Customer portal**            | —                 | read-only     | + recycling / CO₂   | + booking from portal         | white-label       |
| **Online cart / bookings**     | register-interest | basic cart    | paid cart           | + multi-service               | all               |
| **Brokerage & subcontractors** | —                 | —             | margin tracking     | + auto-PO + subbie logins     | all               |
| **Routing & logistics**        | —                 | —             | basic drag-drop     | + map optimisation            | multi-depot       |
| **BI / analytics**             | —                 | basic counts  | per-role dashboards | + custom dashboards           | + drill-down      |
| **CRM**                        | —                 | contacts      | + opportunities     | + pipeline + tasks            | all               |
| **Accounting sync**            | —                 | —             | Xero (1-way)        | Xero (2-way) + QuickBooks     | all + SSO         |

`—` = not available on that plan. A `+` means "everything the tier to the left
has, plus this."

### The gating logic

The £350 → £550 climb is deliberate: **Depot unlocks each module's _core_;
Haulier unlocks its _power_ version.** Depot gets margin tracking — Haulier adds
the subcontractor portal with logins. Depot gets per-role dashboards — Haulier
adds custom ones. Depot gets 1-way Xero — Haulier adds 2-way + QuickBooks.

## Plan highlights at a glance

- **Operator — £79** — the solo skip/waste operator. Full ops core + DWTS
  compliance + basic invoices, and a public "register interest" form for the
  website. Everything one person needs to run and stay compliant.
- **Workshop — £189** — a small fleet with a yard and a mechanic. Adds a
  read-only customer portal, a basic online cart, branded invoice PDFs, contacts
  (CRM), and basic BI counts.
- **Depot — £350** — a full single operation. This is where each module's core
  turns on: **paid online cart**, **brokerage margin tracking**, **basic
  routing**, **per-role dashboards**, CRM opportunities, recycling/CO₂ portal,
  bulk billing, and 1-way Xero.
- **Haulier — £550** — the commercial operator. The power versions: **map route
  optimisation**, **auto-PO + subcontractor logins**, **portal booking**,
  multi-service cart, custom dashboards, CRM pipeline + tasks, self-bill +
  supplier matching, 2-way Xero + QuickBooks.
- **Network — £899** — multi-site, **white-label**, audit-ready. The ceiling:
  everything above at full spec, multi-depot routing, BI drill-down, higher DWTS
  submission volume, and SSO.

## Notes

- **DWTS is the floor, not a feature.** DEFRA Digital Waste Tracking is a legal
  mandate (from October 2026). It ships to **every tier** — you can't gate
  compliance. Only submission _volume_ scales by tier; the _capability_ never does.
- **Network is the ceiling — "Custom" is scrapped.** Former bespoke/on-prem/data-
  residency requests become Network features or **paid add-ons**. The main add-on
  today is a **+£499 onboarding** line.
- **VAT:** the owner (CN-DESIGN) is not currently VAT-registered, so prices are as
  listed with no VAT added. Revisit if/when VAT registration happens.
- **Billing:** Fleetlix's own subscriptions are **Stripe-only** (Stripe Billing
  drives the `plan` via webhook). Worldpay is offered only on the _tenant-facing_
  payment surface (tenants collecting from their own customers), not for Fleetlix
  subscriptions.

## Source of truth

These numbers are not hand-maintained here — they mirror
[`shared/plans/index.ts`](../shared/plans/index.ts):

- **Prices + seat limits** → `PLAN_META` (seat limits also mirror the
  `set_tenant_plan()` SQL in migration `062`, which the DB trigger
  `private.enforce_seat_limit` actually enforces).
- **Module unlocks** → `MODULE_MATRIX`, consumed via `hasModule()` /
  `moduleLevel()`.

If the code and this doc ever disagree, **the code wins** — update this file to
match, don't diverge.
