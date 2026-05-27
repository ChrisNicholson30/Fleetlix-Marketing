# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

The **Fleetlix marketing site**, live at https://fleetlix.com. A static Astro build deployed to Cloudflare Pages, plus one Pages Function (`/api/register-interest`) that posts form submissions to Resend.

This repo is **only the marketing site**. The Fleetlix operations PWA is a separate repo — don't mix conventions across them.

## Stack

| | |
|---|---|
| Build | Astro 6, `inlineStylesheets: 'never'` |
| Interactivity | React 19 islands via `@astrojs/react` — only `InterestForm` and `PricingSection` use it |
| Styles | Tailwind 4 via `@tailwindcss/vite`; CSS custom properties for the colour palette live in `src/styles/global.css` |
| Package manager | pnpm (lockfile committed); Node ≥ 22.12 |
| Host | Cloudflare Pages (`fleetlix-marketing` project, `main` branch auto-deploys) |
| Email | Resend → `contact@fleetlix.com` → Cloudflare Email Routing → personal inbox |

Reference colours via `[color:var(--color-graphite)]` etc. — never hardcode hexes in components. The tokens are: `graphite`, `cyan`, `amber`, `offwhite`, `mist`, `slate`, `success`, `error`.

**No tests, linter, or formatter** are configured. Don't add any without asking — they'd need wiring into the Pages build pipeline too.

**No analytics, no third-party scripts, no tracking pixels.** This is a hard rule. See *Privacy* below.

## Local commands

```bash
pnpm install     # one-time
pnpm dev         # http://localhost:4321 with HMR
pnpm build       # production build → dist/
pnpm preview     # serve the build locally
```

### Docker / OrbStack

A `Dockerfile.dev` + `compose.yaml` run the dev server in a container, useful when you don't want pnpm/Node installed on the host.

```bash
docker compose up -d        # build (first time) + start in the background
docker compose logs -f      # follow logs
docker compose down         # stop and remove the container
```

The service is named `marketing`, image `fleetlix-marketing:latest`, container `fleetlix-marketing`. The compose project is set to `fleetlix` so it appears under the same group as the operations app in OrbStack.

Notes:
- Source is bind-mounted; HMR works.
- `node_modules` lives in an anonymous volume so the container keeps its Linux binaries (sharp/esbuild are platform-specific).
- The image pins Node 22.13-slim and pnpm 11.0.8 — Cloudflare Pages still builds production with `NODE_VERSION=22.12.0`, but pnpm 11.0.8 was retroactively bumped to require Node ≥ 22.13, so the dev image is one minor ahead.
- The Cloudflare Pages Function at `/api/register-interest` is **not** served by `pnpm dev`. To test the form's API end-to-end locally, use `wrangler pages dev` (not currently wired into the container).

## Repo shape

```
fleetlix-marketing/
├── astro.config.mjs            # site: https://fleetlix.com, inlineStylesheets: 'never'
├── src/
│   ├── pages/                  # index, privacy, cookies, thank-you
│   ├── layouts/Base.astro      # <html>, meta, font preload, single <slot/>
│   ├── components/             # Astro sections + React islands
│   ├── config/featureFlags.ts  # SHOW_PRICING, SHOW_CONTACT
│   ├── scripts/cinematic.ts    # scroll-reveal IntersectionObserver + lazy hero video
│   ├── styles/global.css       # colour tokens, Tailwind base, html/body overflow-clip
│   └── assets/hero/            # source PNGs; Astro <Picture> emits avif/webp
├── functions/api/
│   └── register-interest.ts    # Cloudflare Pages Function — POST → Resend
└── public/
    ├── _headers                # CSP + cache rules (Cloudflare reads this verbatim)
    ├── fonts/                  # self-hosted Inter + Space Grotesk (woff2)
    ├── hero/hero.webm          # cinematic loop, attached after LCP
    └── *.{svg,png,ico}         # logos, favicons
```

## Pages and section order

| Route | Purpose |
|---|---|
| `/` | Homepage: Hero → BuiltForRoad → FrontReveal → MotionProduct → FeatureGrid → WhyPwa → WhoFor → (PricingSection \| InterestForm) → (CtaFooter when SHOW_CONTACT) → SiteFooter |
| `/privacy` | UK GDPR policy. Update the `lastUpdated` const when material content changes. |
| `/cookies` | PECR cookie policy. Asserts "no first-party cookies, no analytics". |
| `/thank-you` | Post-payment landing. Links to `https://app.fleetlix.com` (not yet live). |

## Feature flags — `src/config/featureFlags.ts`

- **`SHOW_PRICING`** (currently `false`) — when off: Pricing nav link, `PricingSection`, and hero "Prices from £79/month" CTA are hidden. The homepage renders `InterestForm` in PricingSection's slot.
- **`SHOW_CONTACT`** (currently `false`) — when off: "Book a demo" CTAs in Header + Hero, the Contact nav link, the `CtaFooter` section, and the footer email are all hidden. Legal pages keep their statutory data-protection contact regardless.

Credentials and email addresses stay in source even when flags are off — only the rendered surface is cut.

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

| Var | Format | Notes |
|---|---|---|
| `RESEND_API_KEY` *(secret)* | `re_…` | Scope to **Sending access** on the **fleetlix.com** domain. A key scoped to "no domain" or a different domain returns Resend 403 *"API key not authorized for this domain"*. |
| `INTEREST_TO_EMAIL` | `contact@fleetlix.com` | Where leads land. |
| `INTEREST_FROM_EMAIL` | `Fleetlix <interest@fleetlix.com>` | Must use the verified `fleetlix.com` domain. Display-name form recommended; bare `<addr>` with no display name is invalid and Resend rejects with 422. |
| `TURNSTILE_SECRET_KEY` *(optional)* | from Cloudflare Turnstile | Only set this once the frontend also adds a Turnstile widget — the function *requires* the token when this var is present. |
| `NODE_VERSION` | `22.12.0` | Build-time only. |

**Env var changes require a redeploy** to take effect (Pages → Deployments → ⋯ → Retry deployment).

### When debugging form submissions

1. **Browser shows 502** with Cloudflare's branded "Bad gateway" HTML → the function crashed before responding. Check Pages → Functions → Real-time logs.
2. **Browser shows 502** with JSON `{"error":"Couldn't deliver…"}` → function ran, Resend rejected. Check Resend → Logs for the exact rejection.
3. **Resend Logs shows 200 / Delivered, no email arrives** → Cloudflare Email Routing dropped it, OR the destination silently spam-binned it. Check Email Routing → Overview activity, then the destination's spam folder. Same-domain auto-mail to a brand-new sending domain commonly hits spam for the first ~10 sends; mark "Not spam" 2–3 times and reputation builds.

## DNS / Cloudflare snapshot

These are the records that need to stay correct for the site + email to keep working:

| Type | Name | Value | Purpose |
|---|---|---|---|
| CNAME (proxied) | `fleetlix.com` | `fleetlix-marketing.pages.dev` | Apex → Pages |
| A (proxied) | `www` | any IP | Resolves so the redirect rule can fire |
| MX | `fleetlix.com` | `route1/2/3.mx.cloudflare.net` (priorities 11/26/86) | Cloudflare Email Routing inbound |
| TXT | `fleetlix.com` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | SPF for Email Routing |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (10) | Resend bounce handling |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF for Resend's bounce domain |
| TXT | `resend._domainkey` | DKIM key (long) | Resend DKIM signing |

A Cloudflare **Redirect Rule** (Rules → Redirect Rules, *"Redirect from WWW to root"* template) 301-redirects `www.fleetlix.com/*` → `fleetlix.com/*`.

Cloudflare **Email Routing** has one route: `contact@fleetlix.com` → `chris@cn-design.co.uk` (Verified). Disable Email Routing only when a real fleetlix.com mailbox provider is being set up — the MX records can't be shared.

## SEO

- **`Base.astro`** sets canonical, Open Graph, and Twitter Card meta tags on every page. The default `ogImage` is `/Hero.jpg`. To opt a page out of indexing, pass `noindex={true}` (already done for `/thank-you`).
- **`@astrojs/sitemap`** generates `dist/sitemap-index.xml` and `dist/sitemap-0.xml` at build time. The filter in `astro.config.mjs` excludes `/thank-you` from the sitemap.
- **`public/robots.txt`** allows everything and points at the sitemap.
- **Structured data (JSON-LD):**
  - `Base.astro` emits a sitewide **Organization** entity in `<head>` (Fleetlix + parent CN-DESIGN LTD with Glasgow postal address + SC885094).
  - `src/pages/index.astro` emits a **SoftwareApplication** entity before `</body>` describing the product, pricing, audience, and feature list.
- **Target keywords:** the homepage `<title>` and `<meta description>` lead with "waste & haulage software" / "UK skip-hire and fleet operators". When you write new homepage copy, keep these phrases findable without it reading like SEO sludge.

Both JSON-LD scripts contribute to the CSP `script-src` hash list — see below.

## CSP and security headers

`public/_headers` ships strict headers on every response. Two parts deserve care:

**`script-src` whitelists exactly five inline-script SHA-256 hashes:**
1. Sitewide Organization JSON-LD (every page, from `Base.astro`)
2. Astro's `client:visible` IntersectionObserver bootstrap
3. Astro's `astro-island` custom-element registration
4. Homepage SoftwareApplication JSON-LD (from `src/pages/index.astro`)
5. The homepage's `cinematic.ts` bundle (Astro inlines it because it has no imports)

**Regenerate the hashes after** an Astro version bump **or** after editing `src/scripts/cinematic.ts`, `src/layouts/Base.astro`'s JSON-LD, or `src/pages/index.astro`'s JSON-LD. The exact one-liner is in the comment at the top of `_headers`. If the hashes drift, the offending inline script is silently blocked in production.

**`style-src 'self' 'unsafe-inline'`** — React style props, the modal's `<style>` block, and various `style="…"` attributes from Astro components all need this. We've traded style-XSS hardening for not having to hash every inline style. Don't tighten this without first rewriting the inline styles out.

`/fonts/*` and `/_astro/*` get a 1-year immutable cache — safe because the filenames are content-hashed.

## Privacy

Hard rule: **no analytics, no marketing tags, no advertising pixels, no behavioural tracking, no third-party widgets.** That's what `/cookies` promises in writing.

If you add **any** third-party script — GA, Plausible, a chat widget, a YouTube embed, anything that sets a cookie or makes a third-party network request — you must:

1. Get sign-off from the project owner first.
2. Add a UK GDPR / PECR consent banner that blocks the script until consent is given.
3. Update `/cookies` to disclose what's now being set, by whom, why, and for how long.
4. Audit the CSP — most third parties need `script-src`, `connect-src`, `frame-src`, or `img-src` additions.

The "no analytics" stance is a feature, not laziness. Don't reverse it casually.

## Mobile design protocol

iPhone is a first-class target. The bar is **the apple.com/uk pattern**: vertical scroll only; no section can push the page sideways; no side-to-side rubber-band under touch drag. Violating this is a release blocker.

- **No horizontal page scroll, ever.** Both `html` and `body` set `overflow-x: clip` in `src/styles/global.css`. Use `clip`, not `hidden` — `clip` doesn't establish a new scroll containing block, so the sticky Header keeps working. Don't remove the guard.
- **Sections with decorative bleed clip themselves.** Any section that puts blurs, gradients, glows, or shapes outside its own box (negative offsets like `-left-32`, large translates, oversized absolute children) sets `overflow-hidden` or `overflow-clip` on the section. The global guard catches misses; the *correct* fix is at the section so the offending element stays local and findable.
- **Test at iPhone SE width (375 CSS px) before merge.** If the page rubber-bands sideways even a few pixels at 375px, something exceeds the viewport — find the offender, don't paper over it with a parent wrapper.
- **Don't use `100vw` for full-bleed.** It includes the desktop scrollbar gutter and silently breaks this. Use `w-full` inside a clipped parent, or `width: 100%` on the outer wrapper.
- **Respect iOS safe-area insets.** Hero CTAs, the scroll-cue, and full-bleed footers use `pb-[max(…,env(safe-area-inset-bottom))]`. Nothing under the home indicator or behind the notch.
- **Tappable targets ≥ 44×44 px.** Icon buttons get at least `p-3`.

## Performance

- **Hero LCP** is `glen.png` served as AVIF via `<Picture>` with `loading="eager" fetchpriority="high"`. The `/hero/hero.webm` aerial loop attaches lazily after the LCP via `cinematic.ts` — it must never compete with the LCP image.
- **Self-hosted fonts** are preloaded for only the two display variants used above the fold (Space Grotesk 700, Inter 400). FOUT on other weights is cheaper than the extra round-trips.
- Astro emits ~46 image variants from 4 hero PNGs. If that grows substantially, audit before merging.

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
- **Commit messages explain the *why***, not the *what*. Match the existing tone — short subject, paragraph body when context is needed.
- **Don't commit `dist/` or `node_modules/`.** Already gitignored — keep it that way.

## Ask before doing

- Adding any third-party script or network request from the site (see *Privacy*).
- Tightening or loosening the CSP.
- Adding tests, linters, or formatters.
- Changing the build / deploy pipeline.
- Force-pushing, rebasing published history, or anything that rewrites `main`.
