---
title: Business Card Promo — FLEET30 (30-day trial)
project: Fleetlix
phase: Phase 1 — Billing
created: 2026-07-13
tags: [fleetlix, billing, promo, marketing, qr]
---

# Business Card Promo — FLEET30

Both printed cards' QR codes now resolve to **https://fleetlix.com/card**, which presents promo code **FLEET30** and links to `https://fleetlix.app/signup?promo=FLEET30`. The code extends the free trial from 14 to 30 days.

## Build blocks

### 1. Marketing site (Fleetlix-Marketing, Astro)

- [ ] Drop `card.astro` into `src/pages/` → serves `/card`
- [ ] Drop `fleetlix.vcf` into `public/` → serves `/fleetlix.vcf` (Save-contact button)
- [ ] Confirm Outfit + Geist load (page pulls Google Fonts standalone; swap to site's existing font pipeline if already self-hosted)

### 2. App signup (Fleetlix-App)

- [ ] Read `promo` query param on `/signup`; persist through the auth flow (sessionStorage or signup form hidden field — must survive the email-verification round-trip)
- [ ] Validate against a `promo_codes` table, not a hard-coded string

### 3. Migration (check `schema_migrations` for actual next number first)

```sql
create table promo_codes (
  code        text primary key,
  trial_days  integer not null default 14,
  active      boolean not null default true,
  valid_until date,
  max_redemptions integer,
  created_at  timestamptz not null default now()
);
-- default-deny RLS; read via SECURITY DEFINER RPC only
insert into promo_codes (code, trial_days, valid_until)
values ('FLEET30', 30, null);
```

Redemption count belongs in a separate `promo_redemptions` table (tenant_id FK) so usage is auditable per Blueprint conventions.

### 4. Stripe (Plan C context)

Trial length is set at subscription creation — override when a valid promo is present:

```ts
trial_period_days: promo?.trial_days ?? 14;
```

No Stripe coupon object needed since this discounts _time_, not price. If a code should ever discount price instead, that becomes a Stripe promotion code.

## Notes

- QR payload kept short (`/card`, 25 chars) → stays QR version 2 / 0.52 mm modules at 13 mm print size
- `/card` is `noindex` — it's a physical-channel entry point, not an SEO page
- Attribution: signups arriving with `promo=letsrecycle` are, by definition, card-driven — free channel analytics
- If cards are reprinted for events, mint per-event codes (e.g. `RECYCLE26`) in the same table; the printed QR never changes

## Related

- [[Fleetlix-Blueprint]]
- [[Fleetlix-Plan-of-Action]]
