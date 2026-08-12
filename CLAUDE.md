# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

The **Fleetlix marketing site**, live at https://fleetlix.com. A static Astro build deployed to Cloudflare Pages, plus one Pages Function (`/api/register-interest`) that posts form submissions to Resend.

This repo is **only the marketing site**. The Fleetlix operations PWA is a separate repo — don't mix conventions across them.

## Stack

| | |
|---|---|
| Build | Astro 6, `inlineStylesheets: 'never'` |
| Interactivity | React 19 islands via `@astrojs/react` — only `InterestForm` uses it (`PricingSection` is a static `.astro` component since the billing toggle was dropped) |
| Styles | Tailwind 4 via `@tailwindcss/vite`; CSS custom properties for the colour palette live in `src/styles/global.css` |
| Package manager | pnpm (lockfile committed); Node ≥ 22.12 |
| Host | Cloudflare Pages (`fleetlix-marketing` project, `main` branch auto-deploys) |
| Email | Resend → `contact@fleetlix.com` → Cloudflare Email Routing → personal inbox |

Reference colours via `[color:var(--color-graphite)]` etc. — never hardcode hexes in components. The tokens are: `graphite`, `cyan`, `amber`, `offwhite`, `mist`, `slate`, `success`, `error`.

**No tests, linter, or formatter** are configured. Don't add any without asking — they'd need wiring into the Pages build pipeline too.

**No analytics, no third-party scripts, no tracking pixels.** This is a hard rule. See _Privacy_ below.

## Local commands

```bash
pnpm install     # one-time
pnpm dev         # http://localhost:4321 with HMR
pnpm build       # production build → dist/
pnpm preview     # serve the build locally
```

### Docker / OrbStack

`docker-compose.dev.yml` defines two services under the `fleetlix` project (so both group with the operations app in OrbStack). It is **not** an auto-discovered Compose filename, so every command below passes `-f docker-compose.dev.yml`:

| Service          | Profile     | Dockerfile       | Image                       | Container                 | Serves                           |
| ---------------- | ----------- | ---------------- | --------------------------- | ------------------------- | -------------------------------- |
| `marketing`      | _(default)_ | `Dockerfile.dev` | `fleetlix-marketing:dev`    | `fleetlix-marketing`      | `astro dev` (HMR) on 4321        |
| `marketing-prod` | `prod`      | `Dockerfile`     | `fleetlix-marketing:latest` | `fleetlix-marketing-prod` | static `dist/` via nginx on 4321 |

```bash
docker compose -f docker-compose.dev.yml up -d              # dev server (HMR) → localhost:4321
docker compose -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d --build marketing-prod   # test the prod image locally
```

**Deploy the production image to the Mac Mini (Mini-server):**

```bash
# one-time: create a remote Docker context over SSH
docker context create mini-server --docker "host=ssh://<user>@Mini-server.local"
# build + run on the Mini (re-run after a git pull to update):
docker --context mini-server compose -f docker-compose.dev.yml up -d --build marketing-prod
docker --context mini-server compose -f docker-compose.dev.yml --profile prod down   # to stop
```

Name `marketing-prod` explicitly — `--profile prod` alone would also start the dev service and clash on 4321.

Notes:

- **Dev:** source is bind-mounted (HMR); `node_modules` lives in an anonymous volume so the container keeps its Linux binaries (sharp/esbuild are platform-specific). `astro.config.mjs` sets `server.host: true` + `vite.server.allowedHosts` (`mini-server.local`, `.orb.local`, `.ts.net`) so the dev server is reachable over LAN / OrbStack / Tailscale.
- Both images pin Node 22.13-slim and pnpm 11.0.8 — Cloudflare Pages still builds production with `NODE_VERSION=22.12.0`, but pnpm 11.0.8 was retroactively bumped to require Node ≥ 22.13, so the images are one minor ahead. The prod `Dockerfile` uses a BuildKit heredoc (`# syntax=…`) for its nginx config; OrbStack enables BuildKit by default.
- **The prod image is a static mirror.** The `/api/register-interest` Pages Function and the `public/_headers` CSP are Cloudflare-only and do **not** run in nginx — the interest form won't deliver from the Mini, and only the vCard content-type + asset caching are reproduced in the nginx config. The real site stays on Cloudflare Pages; to test the Function locally use `wrangler pages dev`.

## Repo shape

```
fleetlix-marketing/
├── astro.config.mjs            # site: https://fleetlix.com, inlineStylesheets: 'never'
├── src/
│   ├── pages/                  # index, privacy, cookies, thank-you
│   ├── layouts/Base.astro      # <html>, meta, font preload, single <slot/>
│   ├── components/             # Astro sections + React islands
│   ├── config/featureFlags.ts  # SHOW_PRICING, SHOW_CONTACT
│   ├── config/dwts.ts          # DWTS milestones, Fleetlix build stages, facts, FAQ
│   ├── scripts/lib/motion.ts   # shared reveal/scroll/count-up/spotlight initialisers
│   ├── scripts/cinematic.ts    # homepage bundle — composes the motion initialisers
│   ├── scripts/dwts-timeline.ts # recomputes the DWTS timeline against the reader's clock
│   ├── styles/global.css       # colour tokens, Tailwind base, html/body overflow-clip
│   └── assets/hero/            # source PNGs; Astro <Picture> emits avif/webp
├── functions/api/
│   └── register-interest.ts    # Cloudflare Pages Function — POST → Resend
└── public/
    ├── _headers                # CSP + cache rules (Cloudflare reads this verbatim)
    ├── _redirects              # 301s for retired paths (/card → /rwm2026)
    ├── fonts/                  # self-hosted Inter + Space Grotesk (woff2)
    └── *.{svg,png,ico}         # logos, favicons
```

## Pages and section order

| Route        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | Homepage: Hero → BuiltForRoad → ProductShowcase → StatBand → FrontReveal → MotionProduct → FeatureGrid → WhyPwa → WhoFor → DwtsTimeline → (PricingSection when SHOW_PRICING) → Faq → InterestForm → (CtaFooter when SHOW_CONTACT) → SiteFooter. `ProductShowcase` (`#product-tour`) is a hand-built CSS/SVG mock of the app (no screenshots); `StatBand` shows count-up market figures. `InterestForm` always renders — it's the conversion action while pre-launch, and every pricing CTA anchors to it. |
| `/digital-waste-tracking` | The DWTS pillar page — a full operator's guide to the Digital Waste Tracking Service, and the site's main organic-search asset. Renders `DwtsTimeline` with `variant="guide"`, then scope, the record contents, the two-working-day rule, fees, penalties, sector specifics, Fleetlix's own status, a DWTS-specific FAQ and the GOV.UK sources. Every date and figure comes from `src/config/dwts.ts`. Update its `lastUpdated` const when the substance changes. |
| `/walkthrough` | The 10:39 product recording, behind a **click-to-load facade**. The page ships zero video weight — the 54 MB MP4 in Supabase Storage is not requested until the visitor presses play, and a native `<video>` plays it, so no third-party script runs. The 16 chapters in `src/config/walkthrough.ts` are both the visible copy and the seek targets. See _Walkthrough video_ below before changing anything here. |
| `/install`   | PWA install guide for iPhone, iPad, Android, Windows and Mac, from `src/config/install.ts`. Platform tabs are **CSS-only** (radios + `:has()`), so all five platforms are in the DOM and crawlable and the page works with JS off; `src/scripts/install.ts` only pre-selects the tab matching the visitor's device. Device-support lists sit in `<details>`. Content describes **fleetlix.app** (the app repo) — its Settings paths can go stale without anything here failing, so re-check before a rollout. |
| `/rwm2026`   | The physical-channel landing page — what the printed card QR, an NFC chip or a Wallet pass resolves to. Presents the `letsrecycle` promo (14-day trial vs the 7-day base, links into `/?promo=…#pricing`) and hands over our contact details as a **QR that encodes a vCard inline**, so the scan resolves on the other person's phone with no download. `noindex`, and excluded from the sitemap in `astro.config.mjs`. Renamed from `/card` on 12 Aug 2026; `public/_redirects` 301s the old path permanently because cards encoding it are already printed. Print asset: `public/fleetlix-rwm2026-qr.svg`. |
| `/privacy`   | UK GDPR policy. Update the `lastUpdated` const when material content changes.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/cookies`   | PECR cookie policy. Asserts "no first-party cookies, no analytics".                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/thank-you` | Post-payment landing. Links to `https://app.fleetlix.com` (not yet live).                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `/404`       | Custom not-found page (`src/pages/404.astro`). `noindex`; Astro emits `dist/404.html`, which Cloudflare Pages serves for unmatched routes.                                                                                                                                                                                                                                                                                                                                                                       |

### Conversion path

- **Header.** Desktop nav at `sm:` and up. On mobile (`<sm`), a `<details>`/`<summary>` hamburger opens a drop-down panel (no JS for the disclosure itself; a small inline script closes it on link tap or outside click). When `SHOW_CONTACT` is off, the header's right-side CTA defaults to "Register interest" (amber) → `#register-interest`.
- **Hero.** Primary amber "Register your interest" CTA → `#register-interest` is the load-bearing above-the-fold action. "See how it works" → `#product-tour` (the ProductShowcase mock) sits beside it as a tertiary outline button; the centred scroll-cue still points at `#built`.
- **Interest form.** Always rendered inline (no modal, no trigger click). Below `lg:` the copy stacks above the form card; at `lg:` and up the copy sits to the left of the form. The submit button is the only action.

## Responsive breakpoints

Tailwind 4 defaults, declared explicitly in `@theme` (`src/styles/global.css`) so the design system has a single source of truth:

| Modifier    | Min width | What it targets                     |
| ----------- | --------- | ----------------------------------- |
| _(default)_ | 0         | Phones in portrait                  |
| `sm:`       | 640px     | Large phones, phones in landscape   |
| `md:`       | 768px     | Tablets in portrait (iPad Mini)     |
| `lg:`       | 1024px    | Tablets in landscape, small laptops |
| `xl:`       | 1280px    | Standard desktops                   |
| `2xl:`      | 1536px    | Large desktops / monitors           |

Layout decisions that depend on these:

- Header nav: hamburger below `sm:`, inline anchors at `sm:` and up.
- Hero typography: steps up at `sm:`, again at `lg:`.
- Interest form: stacked below `lg:`, two-column at `lg:` and up.

Always test at **375px (iPhone SE)** before merge — that's the narrowest target we support.

## Feature flags — `src/config/featureFlags.ts`

- **`SHOW_PRICING`** (currently `true`) — when on: the Pricing nav link, `PricingSection` (five fixed plans mirroring `Resources/Pricing.md`: Operator £79 / Workshop £189 / Depot £350 / Haulier £550 / Network £899), and the hero "Prices from £79/month" CTA (→ `#pricing`) are rendered. `InterestForm` renders regardless of this flag. By default the per-plan CTAs anchor to `#register-interest`; `src/scripts/checkout.ts` progressively enhances them into Stripe checkout **only when a valid `?promo=` is in the URL** (see _Promo checkout_ below). If `Resources/Pricing.md` and the app repo's `shared/plans/index.ts` disagree, the code wins.
- **`SHOW_CONTACT`** (currently `false`) — when off: "Book a demo" CTAs in Header + Hero, the Contact nav link, the `CtaFooter` section, and the footer email are all hidden. Legal pages keep their statutory data-protection contact regardless.

Credentials and email addresses stay in source even when flags are off — only the rendered surface is cut.

## DWTS — `src/config/dwts.ts` and `DwtsTimeline.astro`

Digital Waste Tracking is the site's strongest commercial argument (a legal mandate with dates on it) and its biggest organic-search opportunity, so it gets a live timeline on the homepage and a full guide at `/digital-waste-tracking`. Both read **one config**: `src/config/dwts.ts` holds the statutory milestones, Fleetlix's own build stages, the shared figures (`DWTS_FACTS`) and the DWTS FAQ. Don't hardcode a date or a penalty anywhere else.

**Accuracy is the product here.** Every figure in that config traces to a primary source — an SI on legislation.gov.uk, Defra's policy paper, or the Scottish BRIA. Two things stay visible on screen rather than being smoothed over: Northern Ireland's date is a genuine source conflict (Jan 2027 per GOV.UK as updated 5 Aug 2026, but earlier reported as Oct 2026), and the Phase 2 SI had not been laid as of Aug 2026. The guide also names two widely-quoted figures we could not stand up (the "£5,000 per incident" penalty and Scotland's "£40,000 cap"). Operators plan spend against these dates; being the page that is *right* is the whole point.

**State Fleetlix's Defra status precisely — it is now a strong claim, so don't let it drift into a wrong one.** As of 10 Aug 2026: all 14 production approval scenarios pass (the C01 discrepancy raised on 7 Jul 2026 was resolved by Defra confirming the behaviour), Defra has issued production credentials, and **Fleetlix is listed on the GOV.UK register** — the entry reads _"Fleetlix Ltd (used to be CN Design Ltd)"_, which the site quotes verbatim so a buyer cross-checking isn't confused by the old name. The first operator's site API code is configured against production.

The limit that still matters: **approval covers Phase 1 only.** Defra has not published the Phase 2 carrier API, so nobody is approved for it, and both the homepage and the guide say so explicitly. Never let "Defra-approved" appear unqualified next to a Phase 2 or carrier claim. Check the app repo's `Resources/Defra/` before changing any of this.

**How "live" works.** The component computes statuses, the rail fill and the countdown at build time, so no-JS visitors and crawlers get a finished, correct timeline. Then `src/scripts/dwts-timeline.ts` recomputes all three in the browser from the `data-iso` attributes, against the reader's clock — a build that goes stale over a mandate date corrects itself instead of misinforming someone. The geometry (vertical on phones, horizontal from `lg:`) is the `.dwts-*` block in `global.css`: each item owns the rail segment running to the *next* node, so `--seg` (0–1) is all the JS ever writes. No measuring, no absolute percentages.

## Walkthrough video

The `/walkthrough` video is the **only cross-origin request the site ever
makes**, and it is the one exception to the "no third-party requests" rule
below. Two things make it acceptable, and both are load-bearing:

- **It is click-to-load.** No `<video>` element exists until the visitor presses
  play, so pressing play _is_ the consent. That is what keeps it lawful under
  PECR without a consent banner, and what `/cookies` §4 and §5 say in writing.
- **It is a plain file, not an embed.** The MP4 lives in Supabase Storage and is
  played by a native `<video>`. **No third-party JavaScript runs on the page at
  all** — the only thing that crosses an origin is the media itself.

**Three rules:**

1. **Never preload, prefetch, `<link rel=preconnect>` or hover-trigger the
   video.** Any of those makes the request happen without consent and turns the
   cookie policy into a false statement. Supabase's CDN sets a `__cf_bm` cookie
   on `supabase.co` when the file is fetched; the click is what authorises it.
2. **`media-src` only — never add a player SDK.** Swapping this for an embedded
   player (Stream, YouTube, Vimeo) would put third-party script on the page and
   invalidate the whole argument in `/cookies` §4. Rewrite that first.
3. **The origin is pinned exactly**, and mirrors `VIDEO_URL` in
   `src/config/walkthrough.ts`. Change one and you must change the other, or
   playback silently dies. Any other media host is blocked outright — intended.

### If the video is replaced

`VIDEO_URL` in `src/config/walkthrough.ts` is hardcoded, not an env var, because
the CSP pins its origin — a value that could vary at deploy time would just be a
way to break playback without touching the header that has to change with it.

A new cut means updating, in one pass: `VIDEO_URL`, `DURATION_SECONDS`,
`RUNTIME_LABEL`, `RUNTIME_ISO`, `UPLOADED_ISO`, the 16 `chapters`, and the poster
at `src/assets/walkthrough-poster.jpg`. The current chapter times are **measured
against the delivered cut** (30fps, checked against the file's own CHAPTERS, all
inside the 639.06s ffprobe reports) — a chapter button that seeks to the wrong
moment is worse than no chapter list.

Seeking depends on the host answering **HTTP range requests**. Supabase Storage
does (verified: `accept-ranges: bytes`, 206 on a ranged GET). A host that
doesn't would break every chapter button while normal playback still worked.

The Digital Waste Tracking chapter interpolates its dates from
`src/config/dwts.ts` rather than stating them, so the walkthrough can't drift
from the timeline the rest of the site publishes. Northern Ireland's date is an
active source conflict; correcting `dwts.ts` corrects this page too.

**The page has no captions track.** The MP4 ships without one, so nothing on the
page claims captions — the chapter descriptions are the text alternative. Adding
a `.vtt` would be a real accessibility win and needs a `<track>` element plus,
if it is hosted off-origin, a CSP entry.

## Interest form pipeline

```
visitor submits InterestForm (React island)
  → POST /api/register-interest          (Cloudflare Pages Function)
    → POST https://api.resend.com/emails (verified sender: fleetlix.com)
      → contact@fleetlix.com              (no mailbox — Email Routing catches it)
        → Cloudflare Email Routing forward
          → chris@cn-design.co.uk         (real inbox)
```

### Required env vars (Pages Production)

| Var                                 | Format                            | Notes                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY` _(secret)_         | `re_…`                            | Scope to **Sending access** on the **fleetlix.com** domain. A key scoped to "no domain" or a different domain returns Resend 403 _"API key not authorized for this domain"_.                                                                                                                                                                                                         |
| `INTEREST_TO_EMAIL`                 | `contact@fleetlix.com`            | Where leads land.                                                                                                                                                                                                                                                                                                                                                                    |
| `INTEREST_FROM_EMAIL`               | `Fleetlix <contact@fleetlix.com>` | Must use the verified `fleetlix.com` domain. Display-name form recommended; bare `<addr>` with no display name is invalid and Resend rejects with 422. Both sends now use `contact@` — the lead notification is therefore addressed from `contact@` **to** `INTEREST_TO_EMAIL` (also `contact@`); a self-addressed mail is fine but is likelier to spam-bin for the first few sends. |
| `TURNSTILE_SECRET_KEY` _(optional)_ | from Cloudflare Turnstile         | Only set this once the frontend also adds a Turnstile widget — the function _requires_ the token when this var is present.                                                                                                                                                                                                                                                           |
| `NODE_VERSION`                      | `22.12.0`                         | Build-time only.                                                                                                                                                                                                                                                                                                                                                                     |

**Env var changes require a redeploy** to take effect (Pages → Deployments → ⋯ → Retry deployment).

### When debugging form submissions

1. **Browser shows 502** with Cloudflare's branded "Bad gateway" HTML → the function crashed before responding. Check Pages → Functions → Real-time logs.
2. **Browser shows 502** with JSON `{"error":"Couldn't deliver…"}` → function ran, Resend rejected. Check Resend → Logs for the exact rejection.
3. **Resend Logs shows 200 / Delivered, no email arrives** → Cloudflare Email Routing dropped it, OR the destination silently spam-binned it. Check Email Routing → Overview activity, then the destination's spam folder. Same-domain auto-mail to a brand-new sending domain commonly hits spam for the first ~10 sends; mark "Not spam" 2–3 times and reputation builds.

## Promo checkout pipeline

The paid-signup entry point. **Checkout-first:** the customer pays on Stripe on the marketing site, _then_ creates their login on the app (`fleetlix.app`). Gated to promo-code holders.

```
card QR / link → fleetlix.com/?promo=letsrecycle#pricing
  → src/scripts/checkout.ts sees a valid ?promo=, turns each pricing CTA into
    "Start N-day free trial" (otherwise CTAs stay #register-interest links)
  → POST /api/checkout { plan, promo }        (functions/api/checkout.ts)
    → Stripe Checkout Session (mode=subscription, trial_period_days from promo)
      → hosted Stripe page collects details + card, starts the trial
        → success_url → fleetlix.app/onboarding?session_id=…  (APP repo — TBD)
          → app provisions the tenant + plan, user sets their password
```

- **Promo is authoritative server-side.** `functions/api/checkout.ts` requires a valid promo (403 otherwise) and keeps its OWN copy of the promo/plan config — no import from `src/`, so the payment path can't break on a bundling change. The client copy lives in `src/config/checkout.ts`; **keep the two in sync**.
- The promo sets the **trial length via `trial_period_days`**, not a Stripe coupon (coupons discount price, not time). **Monthly only** — no annual price ids.
- `checkout.ts` (client) imports the shared `src/scripts/lib/env.ts`, so it's an external `/_astro/*.js` under `script-src 'self'` — no CSP hash. Hosted Checkout is a redirect (no Stripe.js), so no CSP change either.
- The function returns 503 until the Stripe env vars are set, so it's safe to ship ahead of them; non-promo visitors see no change.

### Checkout env vars (Pages Production)

| Var                                           | Format                                                             | Notes                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY` _(secret)_                | `sk_live_…`                                                        | Live server-side key; used by `functions/api/checkout.ts`.                                                                                                                                                                                   |
| `STRIPE_PRICE_MAP`                            | JSON `{"operator":"price_…","workshop":"price_…",…}`               | Plan slug → **live monthly** Stripe price id. A slug with no entry (e.g. a plan not yet created in Stripe) returns a graceful 400.                                                                                                           |
| `TEST_STRIPE_SECRET_KEY` _(secret, optional)_ | `sk_test_…`                                                        | **Test override.** When set, the function runs entirely in test mode (this key + `TEST_STRIPE_PRICE_MAP`), leaving the live vars untouched. **Remove it to go live** — otherwise real customers get a test checkout they can't actually pay. |
| `TEST_STRIPE_PRICE_MAP`                       | JSON, **test-mode** price ids                                      | Required alongside `TEST_STRIPE_SECRET_KEY` — Stripe test prices are separate objects from live, so this must hold `price_…` ids created in test mode.                                                                                       |
| `CHECKOUT_SUCCESS_URL` _(optional)_           | `https://fleetlix.app/onboarding?session_id={CHECKOUT_SESSION_ID}` | Defaults to this. Keep the literal `{CHECKOUT_SESSION_ID}` placeholder. For testing, point it at `https://fleetlix.com/thank-you?session_id={CHECKOUT_SESSION_ID}` until the app onboarding exists.                                          |
| `CHECKOUT_CANCEL_URL` _(optional)_            | `https://fleetlix.com/#pricing`                                    | Defaults to this.                                                                                                                                                                                                                            |

## DNS / Cloudflare snapshot

These are the records that need to stay correct for the site + email to keep working:

| Type            | Name                | Value                                                | Purpose                                |
| --------------- | ------------------- | ---------------------------------------------------- | -------------------------------------- |
| CNAME (proxied) | `fleetlix.com`      | `fleetlix-marketing.pages.dev`                       | Apex → Pages                           |
| A (proxied)     | `www`               | any IP                                               | Resolves so the redirect rule can fire |
| MX              | `fleetlix.com`      | `route1/2/3.mx.cloudflare.net` (priorities 11/26/86) | Cloudflare Email Routing inbound       |
| TXT             | `fleetlix.com`      | `v=spf1 include:_spf.mx.cloudflare.net ~all`         | SPF for Email Routing                  |
| MX              | `send`              | `feedback-smtp.eu-west-1.amazonses.com` (10)         | Resend bounce handling                 |
| TXT             | `send`              | `v=spf1 include:amazonses.com ~all`                  | SPF for Resend's bounce domain         |
| TXT             | `resend._domainkey` | DKIM key (long)                                      | Resend DKIM signing                    |

A Cloudflare **Redirect Rule** (Rules → Redirect Rules, _"Redirect from WWW to root"_ template) 301-redirects `www.fleetlix.com/*` → `fleetlix.com/*`.

Cloudflare **Email Routing** has one route: `contact@fleetlix.com` → `chris@cn-design.co.uk` (Verified). Disable Email Routing only when a real fleetlix.com mailbox provider is being set up — the MX records can't be shared.

## SEO

- **`Base.astro`** sets canonical, Open Graph, and Twitter Card meta tags on every page. The default `ogImage` is `/og-image.png` (1200×630) — a static render of the homepage hero "network" scene (graphite, route comets, depot radar, Fleetlix lockup). It's a committed asset, not generated at build time; recreate it by running a sharp/librsvg script on a host that has fonts (the slim dev container has none — its `sharp` renders `<text>` as tofu). To opt a page out of indexing, pass `noindex={true}` (already done for `/thank-you` and `/404`).
- **`@astrojs/sitemap`** generates `dist/sitemap-index.xml` and `dist/sitemap-0.xml` at build time. The filter in `astro.config.mjs` excludes `/thank-you` and `/rwm2026` from the sitemap.
- **`public/robots.txt`** allows everything except `/api/` and points at the sitemap.
- **Structured data (JSON-LD):**
  - `Base.astro` emits a sitewide **Organization** entity in `<head>` (`@id` `#organization`; Fleetlix as its own legal entity — `legalName` FLEETLIX LTD, company no. 17331348, London registered office, `foundingDate` 2026-07-09 — plus `areaServed` UK and a sales `contactPoint`).
  - `src/pages/index.astro` emits a single homepage **`@graph`** before `</body>` — **WebSite** (`#website`), **SoftwareApplication** (`#software`: product, pricing, audience, features), and **FAQPage** (`#faq`). Both reference the sitewide Organization via `@id`. One `@graph` = one inline script = one CSP hash.
  - `src/pages/digital-waste-tracking.astro` emits its own `@graph` — **Article** (`#article`), **FAQPage** (`#faq`) and **BreadcrumbList** (`#breadcrumbs`) — again referencing the sitewide Organization as author and publisher. Its FAQ entities are generated from `dwtsFaqItems` in `src/config/dwts.ts`, the same array the visible accordion renders.
  - The visible FAQ accordion (`Faq.astro`) and its schema both read `src/config/faq.ts`, so the structured data can never drift from the on-page copy. Edit the Q&A in one place.
- **Target keywords:** the homepage `<title>` and `<meta description>` lead with "waste & haulage software" / "UK skip-hire and fleet operators". Keep titles ≤ ~60 chars and descriptions ≤ ~160 so they don't truncate in the SERP. When you write new homepage copy, keep these phrases findable without it reading like SEO sludge.

Both JSON-LD scripts (the sitewide Organization and the homepage `@graph`) contribute to the CSP `script-src` hash list — see below.

## CSP and security headers

`public/_headers` ships strict headers on every response. Two parts deserve care:

**`script-src` whitelists exactly seven inline-script SHA-256 hashes — all stable:**

1. Sitewide Organization JSON-LD (every page, from `Base.astro`)
2. Astro's `client:visible` IntersectionObserver bootstrap
3. Astro's `astro-island` custom-element registration
4. Homepage JSON-LD `@graph` — WebSite + SoftwareApplication + FAQPage (from `src/pages/index.astro`)
5. `/digital-waste-tracking` JSON-LD `@graph` — Article + FAQPage + BreadcrumbList. It is built from `src/config/dwts.ts`, so **editing `dwtsFaqItems` changes this hash** even though no markup moved.
6. `/walkthrough` JSON-LD `@graph` — VideoObject + BreadcrumbList. Its `thumbnailUrl` is the build-hashed `/_astro` path of the poster, so **replacing `src/assets/walkthrough-poster.jpg` changes this hash** even though no markup moved.
7. `/install` JSON-LD `@graph` — BreadcrumbList only

**`media-src 'self' https://loguyonztvejrfjcaxxb.supabase.co`** is the only
cross-origin allowance in the policy, and it exists for the click-to-load
walkthrough video. There is no `frame-src` entry — nothing on this site is
framed. Read _Walkthrough video_ before touching either.

The mobile-menu handler (`src/scripts/header-menu.ts`), the homepage `cinematic.ts` bundle, `dwts-timeline.ts`, `walkthrough.ts` and `install.ts` are **no longer inline**: each imports a shared module (`src/scripts/lib/env.ts`, or `lib/motion.ts` which imports it), which Rollup code-splits into a shared chunk, so Astro emits them as **external `/_astro/*.js` files covered by `script-src 'self'`** — no hash. This is deliberate. **New client scripts must follow the same pattern** — import from `lib/env.ts` even if you only need one helper. On 13 Jul 2026 a Cloudflare build-image change altered how esbuild minified those two inline scripts, so their hashes drifted from `_headers` and both were CSP-blocked in prod (blank homepage). External `'self'` scripts can't drift. **Don't reinline them** (keep the shared `env.ts` import) and don't hardcode `/_astro` filenames anywhere.

The FAQ accordion (`Faq.astro`) is native `<details>` with no JS, so adding/editing FAQs does **not** touch the hash list — but editing the FAQ _schema_ in `index.astro`'s `@graph` does.

**Regenerate the hashes only after** an Astro version bump **or** after editing the JSON-LD in `src/layouts/Base.astro`, `src/pages/index.astro`, `src/pages/digital-waste-tracking.astro`, or the `dwtsFaqItems` array in `src/config/dwts.ts` that the last of those serialises (all five hashes are JSON-LD + Astro runtime, which don't re-minify per build). The one-liner is in the comment at the top of `_headers`. **Do not regenerate from a local build unless you've confirmed it matches production** — local and Cloudflare esbuild have differed; hash the live site (`curl https://fleetlix.com/ | …`) when in doubt.

**`style-src 'self' 'unsafe-inline'`** — React style props, the modal's `<style>` block, and various `style="…"` attributes from Astro components all need this. We've traded style-XSS hardening for not having to hash every inline style. Don't tighten this without first rewriting the inline styles out.

`/fonts/*` and `/_astro/*` get a 1-year immutable cache — safe because the filenames are content-hashed.

## Privacy

Hard rule: **no analytics, no marketing tags, no advertising pixels, no behavioural tracking, no third-party widgets.** That's what `/cookies` promises in writing.

**One documented exception:** the `/walkthrough` video, fetched from Supabase
Storage **only when the visitor presses play**. Signed off on 10 Aug 2026 on that
basis, disclosed in `/cookies` §4, and allowed in the CSP via `media-src`. It is
a plain file played by a native `<video>` — no third-party script, no embed SDK.
It is not a precedent for anything that loads on its own: the click *is* the
consent, and that is the entire justification. See _Walkthrough video_ above.

If you add **any** third-party script — GA, Plausible, a chat widget, a YouTube embed, anything that sets a cookie or makes a third-party network request — you must:

1. Get sign-off from the project owner first.
2. Add a UK GDPR / PECR consent banner that blocks the script until consent is given.
3. Update `/cookies` to disclose what's now being set, by whom, why, and for how long.
4. Audit the CSP — most third parties need `script-src`, `connect-src`, `frame-src`, or `img-src` additions.

The "no analytics" stance is a feature, not laziness. Don't reverse it casually.

## Mobile design protocol

iPhone is a first-class target. The bar is **the apple.com/uk pattern**: vertical scroll only; no section can push the page sideways; no side-to-side rubber-band under touch drag. Violating this is a release blocker.

- **No horizontal page scroll, ever.** Both `html` and `body` set `overflow-x: clip` in `src/styles/global.css`. Use `clip`, not `hidden` — `clip` doesn't establish a new scroll containing block, so the sticky Header keeps working. Don't remove the guard.
- **Sections with decorative bleed clip themselves.** Any section that puts blurs, gradients, glows, or shapes outside its own box (negative offsets like `-left-32`, large translates, oversized absolute children) sets `overflow-hidden` or `overflow-clip` on the section. The global guard catches misses; the _correct_ fix is at the section so the offending element stays local and findable.
- **Test at iPhone SE width (375 CSS px) before merge.** If the page rubber-bands sideways even a few pixels at 375px, something exceeds the viewport — find the offender, don't paper over it with a parent wrapper.
- **Don't use `100vw` for full-bleed.** It includes the desktop scrollbar gutter and silently breaks this. Use `w-full` inside a clipped parent, or `width: 100%` on the outer wrapper.
- **Respect iOS safe-area insets.** Hero CTAs, the scroll-cue, and full-bleed footers use `pb-[max(…,env(safe-area-inset-bottom))]`. Nothing under the home indicator or behind the notch.
- **Tappable targets ≥ 44×44 px.** Icon buttons get at least `p-3`.

## Performance

- **Hero LCP** is the `<h1>` text itself — the hero backdrop is a code-drawn SVG/CSS "live network" scene (route arteries with travelling comet lights, radar pings, grid, aurora) with **zero media bytes** on the critical path. All continuous motion is gated behind `prefers-reduced-motion`; the static composition reads complete without it. The old `hero.webm` loop and `aerial.png` still were removed (webm deleted from `public/`; `aerial.png` remains in `src/assets/hero/` unimported, so Astro emits no variants for it). Don't reintroduce hero media without checking it can't regress the LCP.
- **Self-hosted fonts** are preloaded for only the two display variants used above the fold (Space Grotesk 700, Inter 400). FOUT on other weights is cheaper than the extra round-trips.
- Astro emits ~34 image variants from 3 hero PNGs (`road`, `front`, `wheel`). If that grows substantially, audit before merging.

## Deployment

- Cloudflare Pages project `fleetlix-marketing`, branch `main` auto-deploys on push.
- **Build command:** `pnpm run build` (or blank — Pages auto-detects pnpm from the lockfile).
- **Output directory:** `dist`.
- **Custom domains:** `fleetlix.com` (apex) primary; `www.fleetlix.com` 301-redirects to apex via the Cloudflare Redirect Rule above.

## Conventions

- **Update the `lastUpdated` const** in `/privacy` and `/cookies` whenever you change material content. The "Last updated" line is statutory cover.
- **Internal links use root-relative paths** (`/privacy`, not `https://fleetlix.com/privacy`). External links use full URLs and `rel="noopener" target="_blank"` where appropriate.
- **British English** in user-facing copy ("optimise", "behaviour", "colour"). Legal pages reference UK GDPR, PECR, ICO — keep that consistent.
- **No emojis** in source, comments, or commit messages unless explicitly asked.
- **Commit messages explain the _why_**, not the _what_. Match the existing tone — short subject, paragraph body when context is needed.
- **Don't commit `dist/` or `node_modules/`.** Already gitignored — keep it that way.

## Ask before doing

- Adding any third-party script or network request from the site (see _Privacy_).
- Tightening or loosening the CSP.
- Adding tests, linters, or formatters.
- Changing the build / deploy pipeline.
- Force-pushing, rebasing published history, or anything that rewrites `main`.
