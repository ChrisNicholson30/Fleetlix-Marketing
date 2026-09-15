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
│   ├── config/onboarding.ts    # post-payment welcome screen: app handoff, next steps
│   ├── scripts/lib/motion.ts   # shared reveal/scroll/count-up/spotlight initialisers
│   ├── scripts/cinematic.ts    # homepage bundle — composes the motion initialisers
│   ├── scripts/dwts-timeline.ts # recomputes the DWTS timeline against the reader's clock
│   ├── styles/global.css       # colour tokens, Tailwind base, html/body overflow-clip
│   └── assets/hero/            # source PNGs; Astro <Picture> emits avif/webp
├── functions/api/
│   ├── register-interest.ts    # Cloudflare Pages Function — POST → Resend
│   ├── checkout.ts             # POST → Stripe Checkout Session (open plans + promo-gated)
│   └── checkout-session.ts     # GET  → read a session back for /thank-you
└── public/
    ├── _headers                # CSP + cache rules (Cloudflare reads this verbatim)
    ├── _redirects              # 301s: /card → /rwm2026, /terms → /terms-of-service
    ├── fonts/                  # self-hosted Inter + Space Grotesk (woff2)
    ├── fleetlix-app-and-data-security.pdf   # /security download — BUILT IN THE APP REPO
    └── *.{svg,png,ico}         # logos, favicons
```

## Pages and section order

| Route        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | Homepage: Hero → BuiltForRoad → ProductShowcase → StatBand → FrontReveal → MotionProduct → FeatureGrid → WhyPwa → WhoFor → DwtsTimeline → (PricingSection when SHOW_PRICING) → (BrokerNetwork when SHOW_BROKERS) → Faq → InterestForm → (CtaFooter when SHOW_CONTACT) → SiteFooter. `ProductShowcase` (`#product-tour`) is a hand-built CSS/SVG mock of the app (no screenshots); `StatBand` shows count-up market figures. `InterestForm` always renders — it's the conversion action while pre-launch, and every pricing CTA anchors to it. |
| `/digital-waste-tracking` | The DWTS pillar page — a full operator's guide to the Digital Waste Tracking Service, and the site's main organic-search asset. Renders `DwtsTimeline` with `variant="guide"`, then scope, the record contents, the two-working-day rule, fees, penalties, sector specifics, Fleetlix's own status, a DWTS-specific FAQ and the GOV.UK sources. Every date and figure comes from `src/config/dwts.ts`. Update its `lastUpdated` const when the substance changes. |
| `/walkthrough` | The 10:39 product recording, behind a **click-to-load facade**. The page ships zero video weight — the 54 MB MP4 in Supabase Storage is not requested until the visitor presses play, and a native `<video>` plays it, so no third-party script runs. The 16 chapters in `src/config/walkthrough.ts` are both the visible copy and the seek targets. See _Walkthrough video_ below before changing anything here. |
| `/install`   | PWA install guide for iPhone, iPad, Android, Windows and Mac, from `src/config/install.ts`. Platform tabs are **CSS-only** (radios + `:has()`), so all five platforms are in the DOM and crawlable and the page works with JS off; `src/scripts/install.ts` only pre-selects the tab matching the visitor's device. Device-support lists sit in `<details>`. Content describes **fleetlix.app** (the app repo) — its Settings paths can go stale without anything here failing, so re-check before a rollout. |
| `/rwm2026`   | The physical-channel landing page — what the printed card QR, an NFC chip or a Wallet pass resolves to. Presents the `letsrecycle` promo (14-day trial vs the 7-day base, links into `/?promo=…#pricing`) and hands over our contact details as a **QR that encodes a vCard inline**, so the scan resolves on the other person's phone with no download. `noindex`, and excluded from the sitemap in `astro.config.mjs`. Renamed from `/card` on 12 Aug 2026; `public/_redirects` 301s the old path permanently because cards encoding it are already printed. Print asset: `public/fleetlix-rwm2026-qr.svg`. |
| `/brokers`   | **Broker Network** — the second price ladder, for intermediaries. Two rungs from `src/config/brokers.ts`: **Broker Free** (£0, no card, 5 carriers / 2 users / 150 jobs a month) and **Broker Pro** (Unlimited, £249/mo + VAT bought outright, or *earned* by introducing carriers). Carries the referral mechanics, the margin-visibility table and the eligibility rule; `BrokerNetwork.astro` on the homepage is the teaser that links here. Ends with `<InterestForm variant="broker" />`, now a "questions first?" enquiry rather than a launch waitlist. **Signup is open:** Broker Free CTAs link to `fleetlix.app/broker/sign-up`, and Broker Pro CTAs start a £249/month checkout, found by lookup key and never via `STRIPE_PRICE_MAP`. See _Broker Network_ below. Source: `Resources/Fleetlix-Broker-Offer.pdf`, whose "review draft / not yet published" markings are deliberately **not** carried across. |
| `/security`  | **App & Data Security** — the trust document a buyer's IT person is sent, replacing the PDF of the same name. Twenty sections from `src/config/security.ts` (tabular content) plus prose in the page, rendered through `PolicySection` / `PolicyCallout`. Section numbers derive from the `contents` array, so the sticky rail and the on-page numbering renumber together. Bump `DOC.version` and `DOC.issued` when the substance changes. **Section 19, "What we do not claim", is load-bearing** — it is what makes the other nineteen survive a technical review, so items leave it only when they stop being true. The masthead offers the typeset PDF at `DOC.pdf` (see _Security PDF_ below). Print styles in `global.css` still make Cmd-P produce something filable; no `data-reveal` on this page, because anything never scrolled into view would print blank. |
| `/support`   | **Customer support** — the help hub, and the page Stripe reads. Fifteen sections from `src/config/support.ts` plus prose in the page, rendered through `PolicySection` / `PolicyCallout`, numbered off the `contents` array exactly as `/security` is. It exists to do two jobs at once: help a paying operator through checkout, the setup period and daily use, **and** satisfy [Stripe's website checklist](https://docs.stripe.com/get-started/checklist/website) (customer service contact, refund policy, cancellation policy, promotion terms, purchase currency, business address, payment security). `https://fleetlix.com/support` is registered as the account's **Support site URL**, so it is printed on every Stripe receipt — it must never be gated behind `SHOW_CONTACT`, renamed, or 404. **No figure is typed on this page**: prices come from `src/config/pricing.ts` and the trial length from `src/config/checkout.ts` via `resolvePromo`. **The promo code string is never rendered here either** — only its trial length. Paid signup is invitation-only and codes go to named customers, so a working code in the body copy of an indexed page hands the offer to everyone; `PROMO_CODE` stays in the frontmatter purely as the `resolvePromo` lookup key, and `/rwm2026` (noindex, reachable only from a printed card) is the one surface that prints a code. Sections 8–10 (billing, plan changes, cancellation and refunds) are the commercial terms in force — they are not marketing copy, and trimming one removes evidence Stripe holds. Bump `SUPPORT.lastUpdated` when the substance changes. No `data-reveal`, same print reasoning as `/security`. |
| `/terms-of-service` | **Terms of Service** — the contract for the subscription, and the first contractual language this site has ever carried. Twenty-four sections numbered off `contents` in `src/config/terms.ts`, same machinery as `/security` and `/support`. Four commercial decisions are baked in and recorded in that config: **liability capped at 12 months' fees**, **England and Wales**, **business customers only** (which is what lets the cap and exclusions stand under UCTA 1977 — admitting consumers makes sections 17–18 unsafe as written), and **acceptance by required tick box at Stripe Checkout**. **Section 7, "Regulatory compliance stays yours", is the load-bearing one** — Fleetlix records and submits DWTS, DVSA walk-arounds and waste transfer notes, and an operator who thinks the software makes them compliant will be fined and then look for someone to blame. Don't trim it. Cross-references in the prose ("see section 18") are hand-written and do **not** renumber with the array — grep `section ` after any reorder. `/terms` and `/terms/` 301 here via `_redirects`. Bump `TERMS.version` **and** `effective` together; section 21 promises changes take effect at next renewal, which only means something if the version moves. |
| `/privacy`   | UK GDPR policy. Update the `lastUpdated` const when material content changes.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/cookies`   | PECR cookie policy. Asserts "no first-party cookies, no analytics".                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/thank-you` | **The welcome screen** — step three of paid signup, and the page Stripe's `success_url` points at. It is not just a celebration: it confirms the plan, the trial end and the first charge (read back from Stripe by `GET /api/checkout-session`), states the three onboarding steps from `src/config/onboarding.ts`, and hands the buyer on to `fleetlix.app/onboarding` **carrying the `session_id`** — that id is how the app confirms the paid session and provisions the tenant, so `src/scripts/thank-you.ts` forwarding it is load-bearing, not a nicety. Everything on it degrades: with no session id, an unconfigured endpoint or a dead network the page still reads as a correct thank-you and the button still opens the app — the CTA server-renders as the bare `/onboarding` URL, so a no-JS visitor lands on the right screen rather than the app's front door. **That bare form means the app's `/onboarding` must tolerate a missing `session_id`**: it is what an abandoned session, a malformed id and a JS-off visitor all reach. `?demo=<plan>` renders a sample order for design review without touching Stripe (`?demo=depot`, `&interval=year`; bare `?demo` falls back to Operator, and amounts come from `src/config/pricing.ts` so a preview can't quote a price the cards don't); a real test-mode session self-labels with an amber "Stripe test mode" strip. `noindex`, and excluded from the sitemap. |
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

- **`SHOW_PRICING`** (currently `true`) — when on: the Pricing nav link, `PricingSection` (five fixed plans mirroring `Resources/Pricing.md`: Operator £79 / Workshop £189 / Depot £350 / Haulier £550 / Network £899), and the hero "Prices from £79/month" CTA (→ `#pricing`) are rendered. `InterestForm` renders regardless of this flag. **Operator's CTA is an open checkout** (`[data-open-checkout] data-follows-billing`): anyone can buy it at £99/month or £990/year + VAT, with no trial, promo codes ignored, and prices found by lookup key (`fleetlix_operator_monthly_gbp` / `fleetlix_operator_annual_gbp`), never the stale marketing `STRIPE_PRICE_MAP`. The other four per-plan CTAs anchor to `#register-interest`; `src/scripts/checkout.ts` progressively enhances them into Stripe checkout **only when a valid `?promo=` is in the URL** (see _Promo checkout_ below). If `Resources/Pricing.md` and the app repo's `shared/plans/index.ts` disagree, the code wins.
- **`SHOW_BROKERS`** (currently `true`) — when on: the `BrokerNetwork` section on the homepage (directly below `PricingSection`) and the footer link to `/brokers`. **The `/brokers` page itself always builds and is always reachable** — the flag governs discovery, not existence, so a link already handed to a broker cannot 404.
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

## Security PDF

`public/fleetlix-app-and-data-security.pdf` is the download on `/security`. **It
is not built by this repo** — nothing in `pnpm build` produces or checks it, so
nothing here will notice when it drifts from the page it sits beside.

It is generated from `Resources/security/` in the **Fleetlix operations repo**,
where `content.mjs` is the source of truth and `build.mjs` renders it:

```bash
cd <app-repo>/Resources/security && npm install
CHROME_PATH="…/Google Chrome for Testing" node build.mjs --strict
cp fleetlix-app-and-data-security.pdf <marketing-repo>/public/
```

The builder lives there on purpose: every claim in the document is checked
against that codebase, and a security document written from the marketing repo
drifts from the product within a month. It needs `playwright-core` plus a
Chromium binary, and **poppler** (`brew install poppler`) — without `pdftotext`
the pagination audit reports that it did not run rather than reporting a pass.

Three things to know before touching it:

- **Changing this page's substance means rebuilding the PDF in the same
  commit**, or the download starts contradicting the page. `DOC.pdf` and
  `DOC.pdfPages` in `src/config/security.ts` are the page's only handle on it;
  update `pdfPages` if the page count moves.
- **The page and the PDF are allowed to differ in furniture, never in a claim.**
  The page spells cross-references as "section 6" where the PDF uses "§6", the
  page carries a line pointing at `/privacy` and `/cookies` that has no business
  in a standalone document, and the closing blocks are written from opposite
  ends — the page supersedes the PDF, the PDF says where the live page is. That
  is the whole of the permitted divergence.
- **Page count is browser-dependent.** The same source built on Playwright's
  Chromium and on Chrome 148 came out as 14 and 15 pages; `paginationCss` in
  `build.mjs` reserves 46mm below each section opener, chosen as the midpoint of
  a measured plateau for exactly that reason. Re-measure before changing it.

The PDF is **not** content-hashed, so `_headers` caches it for an hour rather
than marking it immutable — a corrected security document must not still be
handed out tomorrow.

## Support page and the support mailbox

`/support` and `/terms-of-service` publish **`contact@fleetlix.com`**
(`SUPPORT.email` in `src/config/support.ts` — one const, ~19 rendered
occurrences). That address is not decorative:

- It is set in **Stripe → Public details** as the customer support email,
  alongside `https://fleetlix.com/support` as the support URL. Stripe prints
  both on **every receipt it sends on our behalf**, so they are what a customer
  uses to reach us about a charge before they reach for a chargeback.
- **The site and Stripe must name the same mailbox.** The terms name it for
  contractual notices and cancellation; the receipt names it for billing
  questions. Two addresses means two inboxes and a customer in the wrong one.
- `contact@` is used rather than `support@` because it is the address Cloudflare
  Email Routing actually forwards (→ `chris@cn-design.co.uk`). A `support@`
  alias was drafted on 28 Aug 2026 and dropped for exactly this reason: an
  address published but not routed black-holes people at the moment they are
  trying to reach a human about money. **To change it: add the Email Routing
  rule first, then update Stripe's Public details in the same sitting.**
- **`security@fleetlix.com` on `/security` has not been verified as routed** and
  predates this note. Check it against the Email Routing rules; if there is no
  catch-all, it is a live black hole on the security document.

`/support` is the plain reading of the commercial terms; **`/terms-of-service` is
the contract**, and section 10 of the support page says so. The cancellation and
refund positions are stated in both and **must move together** — support section
10 and terms sections 13–14 are the same policy written twice, for two readers.

Two commitments on the page are ours to keep rather than the code's:
**a reply within one working day**, and the cancellation/refund position in
section 10 (cancel any time, access runs to the end of the paid period, no
pro-rata refund on monthly, discretionary refund of unused whole months on
annual). If either changes, the page is the record — update it there.

**Known gap, deliberate:** no phone number. Stripe's checklist asks for contact
methods beyond a form, and its Public business information has a support phone
field. Section 1 says plainly that there is no phone line rather than implying
one. `SUPPORT.phone` is `null`; set it and section 1 renders it.

**Stripe Public details, as set 28 Aug 2026** — these five fields are the
account's public face and each maps to something in this repo, so a rename here
breaks a link Stripe is already printing:

| Stripe field | Value |
| --- | --- |
| Customer support email | `contact@fleetlix.com` (`SUPPORT.email`) |
| Customer support URL | `https://fleetlix.com/support` |
| Business website | `https://fleetlix.com` |
| Privacy policy URL | `https://fleetlix.com/privacy` |
| Terms of service URL | `https://fleetlix.com/terms-of-service` |

The **terms of service URL is load-bearing for checkout**, not just for display:
`consent_collection[terms_of_service]=required` in `functions/api/checkout.ts`
links the tick box to whatever is set here, and Stripe rejects session creation
outright if it is blank.

## Broker Network

A **second, separate price ladder** for intermediaries, living in
`src/config/brokers.ts` rather than `pricing.ts`. They are not merged on
purpose: the five operator tiers are seat-and-module priced and all cost money;
the two broker rungs are capacity-priced, one is free forever, and the paid rung
is normally *earned* rather than bought. Merging would force `Tier` to carry a
nullable price and an "earned" state meaningless to the other five.

Rendered twice: `BrokerNetwork.astro` is the homepage teaser (two rungs, the
free tier's limits, the eligibility line, CTA to the page); `/brokers` is the
whole offer. Both read the one config.

**Three things that must not drift:**

- **The eligibility line is load-bearing, not small print.** *"Broker Free is for
  intermediaries only — no owned containers, no owned fleet, no jobs run in your
  own name."* Without it, every Operator at £99 reclassifies as a free broker and
  the operator ladder has an obvious door out of it. It renders on screen on
  **both** surfaces; keep it there.
- **No DWTS date is typed.** October 2027 comes from `DWTS_MILESTONES` in
  `src/config/dwts.ts` (`phase-2-mandatory`), and `/brokers` repeats that
  milestone's `caveat` — the SI had not been laid as of Aug 2026 — rather than
  stating the date flatly. Same one-source rule as everywhere else.
- **£249 carries "+ VAT".** FLEETLIX LTD is VAT registered; an unqualified figure
  is a misquote to a business buyer.

**Signup is open, through two different doors (15 Sep 2026).**

- **Broker Free** links to `fleetlix.app/broker/sign-up` (`BROKER_FREE_SIGNUP_URL`).
  That app page creates the login and the broker tenant and signs the broker
  in, with no card and no Stripe object. Never route it through checkout: a £0
  Stripe session asks for a card the offer promises is never taken.
- **Broker Pro** is bought outright: **£249/month + VAT, no trial, monthly
  only, no promo code**. The flow is `[data-broker-checkout]` →
  `POST /api/checkout {plan:"broker_pro"}` → Stripe → `/thank-you?…&plan=broker_pro`
  (broker next steps) → `fleetlix.app/onboarding?session_id=…`. The app's
  `provision.ts` creates a `tenant_type = 'broker'` tenant on `broker_pro`
  landing on the broker desk, and signs the buyer straight in.
- **The price is found by lookup key** `fleetlix_broker_pro_monthly_gbp`, never
  through `STRIPE_PRICE_MAP`. The app's `parsePriceMap()` throws on a
  non-carrier entry, and that throw takes down every carrier checkout and
  webhook. `functions/api/checkout.ts` refuses to sell unless the price is
  exactly 24900 GBP, tax-exclusive, and bills every one month. The app side
  (`shared/billing/broker.ts`) holds the same rule, requires metadata *and* the
  billed price to agree before provisioning, and drops a cancelled Pro to Broker
  Free in the webhook.
- **This needs the app PR deployed first.** Until it is, a Broker Pro buyer
  pays and then hits "This checkout has no valid plan" on `/onboarding`.

**The launch has happened.** `BROKER_LAUNCH` in `src/config/brokers.ts` now
records the date accounts opened (15 Sep 2026). No page renders an "opens" date
any more, so there is nothing to slip.

The **referral mechanic is the pricing model**, not a growth hack: introduce a
carrier who completes ten jobs in thirty days (at least three their own direct
work) and two months of Pro land in your account, up to twelve at a time. **No
cash changes hands in either direction** — a cash bounty would put a broker in
the position of leaning on a carrier to sign up, which poisons the relationship
the product depends on. Nothing is ever clawed back, and Pro expiry drops you to
Free rather than to nothing.

## Interest form pipeline

`InterestForm` takes a **`variant` prop** (`"operator"` — the default, on the
homepage — or `"broker"`, on `/brokers`). The variant swaps the two selects and
the surrounding copy, and stamps `enquiry_type` on the payload so the two lead
types are distinguishable in the inbox (broker leads get a `Fleetlix BROKER`
subject line). The broker variant asks **carriers on panel** and **jobs per
month** rather than fleet size — Broker Free eligibility is explicitly "no owned
fleet", so asking a broker their fleet size contradicts the page they arrived
from. `CARRIER_COUNTS` and `JOB_VOLUMES` are duplicated in
`src/components/InterestForm.tsx` and `functions/api/register-interest.ts`;
**change both together**, as with the checkout promo config.

The homepage (operator) variant also carries an **Operations platform / Fleetlix
Compliance** choice. Picking Compliance swaps fleet size for **waste movements per
month** (`MOVEMENT_VOLUMES`, duplicated the same way), stamps
`enquiry_type: "compliance"`, and sends a `Fleetlix COMPLIANCE` subject line. So does
arriving via `#register-compliance`, which is where the Compliance pricing card's CTA
links **only with JS off**. With JS, that CTA is an open checkout (`[data-open-checkout]
data-plan="compliance"`): £49/month + VAT, no promo, no trial, monthly only, price found by
lookup key `fleetlix_compliance_monthly_gbp`. Stripe → `/thank-you?…&plan=compliance`
(Compliance next steps) → `fleetlix.app/onboarding`, where the app's `provision.ts`
creates a `compliance` tenant (`business_type='compliance'`, entitlement columns from
`complianceEntitlementPatch()`) and signs the buyer straight in to `/compliance`. The
form's Compliance option is now for questions, not signup. **Needs the app PR deployed
first**, or buyers pay and hit "no valid plan". See `Resources/compliance-launch.md`.

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

The paid-signup entry point. **Checkout-first:** the customer pays on Stripe on the marketing site, _then_ creates their login on the app (`fleetlix.app`). Gated to promo-code holders **for Workshop, Depot, Haulier and Network only**. Operator, Fleetlix Compliance and Broker Pro are `OPEN_PLANS` in `functions/api/checkout.ts`: no code, no trial, each price found by lookup key and checked (amount, currency, tax-exclusive, cadence, exactly one active price) before a session is created.

**Four steps, and the third one is ours.** Choose a plan → pay on Stripe →
welcome screen → set up in the app:

```
card QR / link → fleetlix.com/?promo=letsrecycle#pricing
  → src/scripts/checkout.ts sees a valid ?promo=, turns each pricing CTA into
    "Start N-day free trial" (otherwise CTAs stay #register-interest links)
  → POST /api/checkout { plan, promo, interval }   (functions/api/checkout.ts)
    → Stripe Checkout Session (mode=subscription, trial_period_days from promo,
      automatic_tax + tax_id_collection on, terms-of-service tick box required)
      → hosted Stripe page collects details + card, starts the trial
        → success_url → fleetlix.com/thank-you?session_id=…   ← THE WELCOME SCREEN
          → GET /api/checkout-session?session_id=…  (functions/api/checkout-session.ts)
            reads the session back: plan, interval, trial end, amount, email
          → "Create your login" → fleetlix.app/onboarding?session_id=…  (APP repo)
            → app provisions the tenant + plan, user sets their password
```

- **Promo is authoritative server-side.** `functions/api/checkout.ts` requires a valid promo (403 otherwise) and keeps its OWN copy of the promo/plan config — no import from `src/`, so the payment path can't break on a bundling change. The client copy lives in `src/config/checkout.ts`; **keep the two in sync**.
- The promo sets the **trial length via `trial_period_days`**, not a Stripe coupon (coupons discount price, not time). **Monthly only** — no annual price ids.
- `checkout.ts` (client) imports the shared `src/scripts/lib/env.ts`, so it's an external `/_astro/*.js` under `script-src 'self'` — no CSP hash. Hosted Checkout is a redirect (no Stripe.js), so no CSP change either. `src/scripts/thank-you.ts` follows the same pattern — it imports `lib/env.ts` and is emitted external, so the welcome screen adds no hash either.
- The function returns 503 until the Stripe env vars are set, so it's safe to ship ahead of them; non-promo visitors see no change.

### The welcome screen (`/thank-you`)

**Why the redirect lands here and not on the app.** Stripe returns a completed
session and nothing else. A buyer bounced from a card form straight onto a login
screen has no confirmation of what they bought — the receipt email is minutes
behind — and no route back if the app is mid-deploy. This page is the join
between the two systems, and the only place the `session_id` is visible to a
human before the app consumes it.

- **`GET /api/checkout-session` is read-only and deliberately narrow.** It
  returns a hand-written summary, never a proxied Stripe object — a Checkout
  Session carries the buyer's address, card brand and tax ids, none of which has
  any business being fetched by whoever holds the URL. A session that is not
  `complete` gets its status back and nothing else, so a stale link can't be
  turned into a lookup of someone's details.
- **It must use the same key mode as `checkout.ts`.** `TEST_STRIPE_SECRET_KEY`
  takes precedence in both files; a live key returns 404 for a test session id
  and vice versa, which shows up as a welcome screen with no summary card.
- **Amounts are ex VAT**, like every price on the site, and the page renders the
  `+ VAT` suffix with them. Stripe Tax adds the VAT at invoice time.
- **Rows are toggled with the `hidden` ATTRIBUTE, not Tailwind's `hidden`
  class** — they carry `flex`/`sm:flex` for their laid-out state, and a plain
  display utility wins the cascade against the class. Get this wrong and the
  placeholder rows show through with an em dash beside "First payment".
- The cancellation line in the summary card restates **support section 10** and
  **terms sections 13–14**. That is the same policy written for three readers;
  move all three together.

### Testing the signup flow end to end

The whole path is walkable without a live price or a real card.

1. **The welcome screen alone**, no Stripe at all:
   `/thank-you?demo=<plan>` renders a sample order and labels itself "Preview
   only" — `?demo=depot`, `?demo=network`, plus `&interval=year` for the annual
   figure. Bare `?demo` falls back to `DEMO_SUMMARY` in
   `src/config/onboarding.ts`; the amounts come from `src/config/pricing.ts`.
   Use it for design and copy review; it proves nothing about the payment path.
2. **The real path in Stripe test mode.** Set `TEST_STRIPE_SECRET_KEY` +
   `TEST_STRIPE_PRICE_MAP` (test-mode price ids — they are separate objects from
   live) in Pages Production and redeploy. Then open
   `fleetlix.com/?promo=letsrecycle#pricing`, which is what turns the plan CTAs
   into "Start 14-day free trial" buttons, and pay with `4242 4242 4242 4242`.
   A test-mode session self-labels on the welcome screen with an amber strip —
   **if that strip is missing you are on live keys.**
3. **Check the handoff.** The "Create your login" button must read
   `fleetlix.app/onboarding?session_id=cs_…`. No id means the app will land the
   buyer on a sign-in screen for an account that does not exist yet.
4. **Test annual as well as monthly.** Flip the billing toggle before clicking;
   the interval is read at click time. That path has never been exercised.
5. **Remove `TEST_STRIPE_SECRET_KEY` and `TEST_STRIPE_PRICE_MAP` to go live**,
   and redeploy — leaving them set means real customers get a test checkout they
   cannot actually pay.

**Still outstanding before any of this bills correctly:** `STRIPE_PRICE_MAP`
points at the stale v1 ladder, so a checkout today would advertise £99 and charge
£79. See `Resources/stripe-pricing-id.md`.

### Checkout env vars (Pages Production)

| Var                                           | Format                                                             | Notes                                                                                                                                                                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY` _(secret)_                | `sk_live_…`                                                        | Live server-side key; used by `functions/api/checkout.ts`.                                                                                                                                                                                   |
| `STRIPE_PRICE_MAP`                            | JSON `{"operator":"price_…","workshop":"price_…",…}`               | Plan slug → **live monthly** Stripe price id. A slug with no entry (e.g. a plan not yet created in Stripe) returns a graceful 400.                                                                                                           |
| `TEST_STRIPE_SECRET_KEY` _(secret, optional)_ | `sk_test_…`                                                        | **Test override.** When set, the function runs entirely in test mode (this key + `TEST_STRIPE_PRICE_MAP`), leaving the live vars untouched. **Remove it to go live** — otherwise real customers get a test checkout they can't actually pay. |
| `TEST_STRIPE_PRICE_MAP`                       | JSON, **test-mode** price ids                                      | Required alongside `TEST_STRIPE_SECRET_KEY` — Stripe test prices are separate objects from live, so this must hold `price_…` ids created in test mode.                                                                                       |
| `STRIPE_TOS_CONSENT` _(optional)_             | `off`                                                              | **Escape hatch, not a setting.** Terms-of-service consent is ON by default: the session is created with `consent_collection[terms_of_service]=required`, so Stripe renders a required tick box and records acceptance — that is what makes `/terms-of-service` binding. **Prerequisite: the terms URL must be set in the Stripe Dashboard** (the API has no field for it); until it is, Stripe rejects session creation outright, exactly as `automatic_tax` does without Stripe Tax enabled. Set to `off` only to unblock a test — leaving it off means taking money with nobody having accepted the terms, and makes section 2 of that page untrue. |
| `CHECKOUT_SUCCESS_URL` _(optional)_           | `https://fleetlix.com/thank-you?session_id={CHECKOUT_SESSION_ID}` | Defaults to this — the **welcome screen**, not the app. Stripe hands back a completed session and nothing else, so bouncing a buyer straight to a login form leaves them with no confirmation of what they bought (the receipt email is minutes behind) and no route back if the app is mid-deploy. `/thank-you` states the order, then links on to `fleetlix.app/onboarding` with the same id. **Keep the literal `{CHECKOUT_SESSION_ID}` placeholder** in any override — the app cannot provision the tenant without it. |
| `CHECKOUT_CANCEL_URL` _(optional)_            | `https://fleetlix.com/#pricing`                                    | Defaults to this.                                                                                                                                                                                                                            |

## Legal entity

The registered details behind every legal line on the site. They are rendered
in `SiteFooter.astro`, `/privacy`, `/terms-of-service`, `/support`, `/security`,
`/rwm2026` and the interest-form email in
`functions/api/register-interest.ts` — none of it reads from a shared config, so
changing one means grepping for the rest.

|                               |                                          |
| ----------------------------- | ---------------------------------------- |
| Legal name                    | FLEETLIX LTD                             |
| Company number                | 17331348 (registered in England and Wales) |
| Registered office             | 66 Paul Street, London EC2A 4NA           |
| ICO registration              | ZC207602                                 |
| VAT registration number (VRN) | 526781566                                |

**The VRN is not currently rendered anywhere on the site**, and it is not in the
Organization JSON-LD either — `Base.astro` carries a single Companies House
`identifier`, no `vatID`. `/support` section 7 says the VAT invoice "shows our
VAT registration", which is Stripe printing it from the account's tax settings,
not this repo. Publishing it here is a separate decision; this table is the
record of what the number is.

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

**`script-src` whitelists exactly eight inline-script SHA-256 hashes — all stable:**

1. Sitewide Organization JSON-LD (every page, from `Base.astro`)
2. Astro's `client:visible` IntersectionObserver bootstrap
3. Astro's `astro-island` custom-element registration
4. Homepage JSON-LD `@graph` — WebSite + SoftwareApplication + FAQPage (from `src/pages/index.astro`)
5. `/digital-waste-tracking` JSON-LD `@graph` — Article + FAQPage + BreadcrumbList. It is built from `src/config/dwts.ts`, so **editing `dwtsFaqItems` changes this hash** even though no markup moved.
6. `/walkthrough` JSON-LD `@graph` — VideoObject + BreadcrumbList. Its `thumbnailUrl` is the build-hashed `/_astro` path of the poster, so **replacing `src/assets/walkthrough-poster.jpg` changes this hash** even though no markup moved.
7. `/install` JSON-LD `@graph` — BreadcrumbList only
8. `/security` JSON-LD `@graph` — BreadcrumbList only

**`media-src 'self' https://loguyonztvejrfjcaxxb.supabase.co`** is the only
cross-origin allowance in the policy, and it exists for the click-to-load
walkthrough video. There is no `frame-src` entry — nothing on this site is
framed. Read _Walkthrough video_ before touching either.

The mobile-menu handler (`src/scripts/header-menu.ts`), the homepage `cinematic.ts` bundle, `dwts-timeline.ts`, `walkthrough.ts` and `install.ts` are **no longer inline**: each imports a shared module (`src/scripts/lib/env.ts`, or `lib/motion.ts` which imports it), which Rollup code-splits into a shared chunk, so Astro emits them as **external `/_astro/*.js` files covered by `script-src 'self'`** — no hash. This is deliberate. **New client scripts must follow the same pattern** — import from `lib/env.ts` even if you only need one helper. On 13 Jul 2026 a Cloudflare build-image change altered how esbuild minified those two inline scripts, so their hashes drifted from `_headers` and both were CSP-blocked in prod (blank homepage). External `'self'` scripts can't drift. **Don't reinline them** (keep the shared `env.ts` import) and don't hardcode `/_astro` filenames anywhere.

The FAQ accordion (`Faq.astro`) is native `<details>` with no JS, so adding/editing FAQs does **not** touch the hash list — but editing the FAQ _schema_ in `index.astro`'s `@graph` does.

**Regenerate the hashes only after** an Astro version bump **or** after editing the JSON-LD in `src/layouts/Base.astro`, `src/pages/index.astro`, `src/pages/digital-waste-tracking.astro`, `src/pages/security.astro`, or the `dwtsFaqItems` array in `src/config/dwts.ts` that the third of those serialises (all eight hashes are JSON-LD + Astro runtime, which don't re-minify per build). The one-liner is in the comment at the top of `_headers`. **Do not regenerate from a local build unless you've confirmed it matches production** — local and Cloudflare esbuild have differed; hash the live site (`curl https://fleetlix.com/ | …`) when in doubt.

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
