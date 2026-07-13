---
title: SEO Framework — Marketing Site Optimisation
tags: [seo, web-dev, marketing, framework]
created: 2026-06-22
---

# SEO Framework

> The 7 layers of SEO. Work top-down: foundations first, content last. Skipping a layer leaves coverage on the table.

```
1. CRAWLABILITY    → Can Google find & index the pages?
2. TECHNICAL       → Is the site fast, valid, structured?
3. ON-PAGE         → Does each page tell Google what it's about?
4. CONTENT         → Is there something worth ranking?
5. STRUCTURED DATA → Are you eligible for rich results?
6. AUTHORITY       → Do other sites & signals vouch for you?
7. LOCAL           → Are you visible to nearby buyers? (critical for SMEs)
```

---

## Layer 1 — Crawlability & Indexing

The non-negotiable foundation. If this is broken nothing else matters.

| Item                  | What to do                      | Why                              |
| --------------------- | ------------------------------- | -------------------------------- |
| `robots.txt`          | Allow crawl, link to sitemap    | Controls crawler access          |
| `sitemap.xml`         | Auto-generate, submit to GSC    | Tells Google every URL           |
| Canonical tags        | One per page, self-referencing  | Kills duplicate-content dilution |
| Google Search Console | Verify + submit sitemap day one | Your only direct line to Google  |
| Bing Webmaster Tools  | Verify too                      | Powers Bing + ChatGPT search     |
| Index check           | `site:yourdomain.com` in Google | Confirms what's actually indexed |

**robots.txt template:**

```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml
```

**Astro sitemap** (your stack): add `@astrojs/sitemap` to `astro.config`, set `site:` URL — it generates automatically on build.

---

## Layer 2 — Technical SEO

Speed and structure. Google ranks Core Web Vitals; users abandon slow sites.

### Core Web Vitals targets

| Metric | Target  | What it measures           |
| ------ | ------- | -------------------------- |
| LCP    | < 2.5s  | Largest paint (hero load)  |
| INP    | < 200ms | Interaction responsiveness |
| CLS    | < 0.1   | Layout shift / jank        |

### Performance checklist

- **Images**: serve AVIF/WebP, lazy-load below fold, always set `width`/`height` (prevents CLS). Astro `<Image />` handles this.
- **Fonts**: `font-display: swap`, preload the one hero font, self-host (no render-blocking Google Fonts request).
- **JS**: ship less. Astro islands = zero JS by default — lean into it for a marketing site.
- **Caching**: long `Cache-Control` on static assets via Cloudflare.
- **HTTPS**: mandatory. Force-redirect HTTP → HTTPS.
- **Mobile-first**: Google indexes the mobile version. Test on real viewport.
- **404 handling**: custom 404 + 301 redirects for any moved/old URLs.

### URL hygiene

- Lowercase, hyphenated, descriptive: `/waste-carrier-software` not `/page?id=42`
- Shallow depth — keep important pages ≤ 2 clicks from home.
- Stable URLs. Never change a ranking URL without a 301.

---

## Layer 3 — On-Page SEO

Per-page signals. Every page targets **one primary keyword + intent**.

### The per-page checklist

```
[ ] <title>          — 50-60 chars, keyword near front, brand at end
[ ] meta description — 150-160 chars, benefit + CTA (drives CTR, not rank)
[ ] H1               — exactly one, contains primary keyword
[ ] H2/H3            — logical hierarchy, secondary keywords
[ ] Keyword in       — first 100 words, one subheading, image alt, URL
[ ] Internal links   — 2-4 to related pages, descriptive anchor text
[ ] Image alt text   — descriptive, not stuffed
[ ] Open Graph tags  — title, description, image (social previews)
```

**Head template:**

```html
<title>Job Planning Software for Waste Carriers | Fleetlix</title>
<meta
  name="description"
  content="Plan jobs, run yards, stay SEPA-compliant. Fleetlix is the job-planning platform built for UK waste carriers. Try it free."
/>
<link rel="canonical" href="https://fleetlix.com/" />

<!-- Open Graph -->
<meta property="og:title" content="Job Planning Software for Waste Carriers | Fleetlix" />
<meta property="og:description" content="Plan jobs. Run yards. Move on." />
<meta property="og:image" content="https://fleetlix.com/og-image.png" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

**Title formula:** `Primary Keyword + Modifier | Brand` — modifiers like "for UK", "software", "2026" capture long-tail.

---

## Layer 4 — Content & Keyword Strategy

You can't out-rank what you don't write. Content is what actually earns coverage.

### Keyword intent map

| Intent        | Example                           | Page type       |
| ------------- | --------------------------------- | --------------- |
| Navigational  | "fleetlix login"                  | Brand pages     |
| Commercial    | "waste carrier software"          | Landing/product |
| Transactional | "skip hire job planner pricing"   | Pricing/signup  |
| Informational | "how to comply with SEPA BMW ban" | Blog/guides     |

### The hub-and-spoke model

```
        [Pillar Page: "Waste Carrier Operations"]
                /        |         \
        [Job Planning] [Compliance] [Yard Management]
         (spoke)        (spoke)       (spoke)
```

- **Pillar** = broad, high-volume term, links out to all spokes.
- **Spokes** = specific long-tail guides, each links back to pillar.
- This topical clustering signals authority on a whole subject, not one page.

### Content rules

- **Search intent match** > keyword density. Answer what the searcher actually wants.
- **Long-tail wins for SMEs**: "waste carrier job software Scotland" converts better than "logistics software" and is winnable.
- **E-E-A-T**: Experience, Expertise, Authoritativeness, Trust. Show real domain knowledge (you have it — Total Recycling Scotland), author bios, case studies.
- **Freshness**: update cornerstone content; Google favours recently-maintained pages.
- **Depth**: cover the topic fully so you rank for dozens of related queries, not one.

---

## Layer 5 — Structured Data (Schema.org)

JSON-LD markup → eligibility for **rich results** (stars, FAQs, breadcrumbs) = higher CTR.

### Priority schemas for a business marketing site

| Schema                            | Gets you                  | Use on                |
| --------------------------------- | ------------------------- | --------------------- |
| `Organization`                    | Knowledge panel, logo     | Site-wide (homepage)  |
| `LocalBusiness`                   | Map pack, hours, location | Homepage / contact    |
| `Product` / `SoftwareApplication` | Price, ratings            | Product/pricing pages |
| `FAQPage`                         | Expandable Q&A in SERP    | Any page with FAQs    |
| `BreadcrumbList`                  | Breadcrumb trail in SERP  | All deep pages        |
| `Article`                         | Article rich result       | Blog posts            |

**Organization JSON-LD:**

```html
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Fleetlix",
    "url": "https://fleetlix.com",
    "logo": "https://fleetlix.com/logo.png",
    "sameAs": ["https://www.linkedin.com/company/fleetlix"]
  }
</script>
```

> Validate everything with Google's **Rich Results Test** and **Schema Markup Validator** before shipping.

---

## Layer 6 — Authority & Off-Page

Google's tie-breaker. Two equal pages → the one with better signals wins.

- **Backlinks** — quality over quantity. One link from a trade body or local news beats 50 directory spam links.
- **Digital PR** — get listed in industry directories (waste/logistics associations), local business press.
- **Internal linking** — your own most powerful, free authority tool. Funnel link equity to money pages.
- **Brand search** — people Googling your brand name is a ranking signal. Build it via consistent NAP + social.
- **Avoid**: link farms, paid links, PBNs. Penalties are brutal and slow to recover from.

---

## Layer 7 — Local SEO (high-leverage for UK SMEs)

For a business serving a region, this is often the single biggest win.

| Action                      | Detail                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| **Google Business Profile** | Claim, verify, fully complete. Free, huge.                         |
| **NAP consistency**         | Name/Address/Phone _identical_ everywhere (site, GBP, directories) |
| **Local citations**         | Yell, Thomson Local, industry directories                          |
| **Reviews**                 | Actively request; respond to all. Volume + recency rank.           |
| **LocalBusiness schema**    | Reinforces location to crawlers                                    |
| **Location pages**          | One per service area if you serve several                          |
| **Embed a map**             | On contact page — local relevance signal                           |

---

## Implementation Order (your priority queue)

```
WEEK 1 — Foundation
  → GSC + Bing verified, sitemap submitted
  → robots.txt + canonicals live
  → HTTPS forced, 404 page set

WEEK 1 — Technical
  → Image optimisation (AVIF/WebP, dimensions)
  → Font preload + swap
  → Lighthouse audit → fix CWV reds

WEEK 2 — On-page
  → Title + meta per page
  → One H1 each, heading hierarchy
  → OG tags + internal links

WEEK 2 — Schema
  → Organization + LocalBusiness
  → Product on pricing, FAQ where relevant
  → Validate all

ONGOING — Content
  → Pillar page + 3-5 spokes
  → 1 keyword-targeted guide / fortnight
  → Update cornerstone quarterly

ONGOING — Local + Authority
  → GBP optimised, reviews flowing
  → Citations built, NAP consistent
```

---

## Tooling

| Job               | Free                                          | Paid               |
| ----------------- | --------------------------------------------- | ------------------ |
| Index/coverage    | Google Search Console                         | —                  |
| Performance       | Lighthouse (CLI/DevTools), PageSpeed Insights | —                  |
| Keywords          | Google autocomplete, "People also ask"        | Ahrefs, Semrush    |
| Schema validation | Rich Results Test, Schema Validator           | —                  |
| Crawl audit       | Screaming Frog (500 URLs free)                | Screaming Frog Pro |
| Rank tracking     | —                                             | Ahrefs, AccuRanker |

---

## Quick-reference: pre-launch checklist

```
[ ] GSC verified + sitemap submitted
[ ] robots.txt allows crawl, links sitemap
[ ] Every page: unique title + meta description
[ ] One H1 per page, logical heading order
[ ] Canonical tag on every page
[ ] All images: alt text + dimensions + WebP/AVIF
[ ] OG + Twitter card tags present
[ ] Organization + LocalBusiness schema, validated
[ ] HTTPS forced, no mixed content
[ ] Mobile Lighthouse ≥ 90 performance
[ ] CWV all green (LCP/INP/CLS)
[ ] Internal links connect all key pages
[ ] Custom 404 + 301s for any old URLs
[ ] Google Business Profile claimed (if local)
```
