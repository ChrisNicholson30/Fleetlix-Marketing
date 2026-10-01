# Fleetlix marketing site: GPT/Codex agent instructions

This repository builds `fleetlix.com`. It is a static Astro site on Cloudflare Pages with Pages Functions for enquiries and checkout. The operations app at `fleetlix.app` is a separate repository. Keep changes scoped to the marketing site unless the task explicitly includes the app.

## Work in this repository

- Use pnpm and Node 22.12 or newer. `pnpm dev` serves the site locally; `pnpm build` produces `dist/`. Do not commit `dist/` or `node_modules/`.
- The stack is Astro 7, React 19 islands, Tailwind 4, and Cloudflare Pages Functions. Colour tokens live in `src/styles/global.css`; use the tokens instead of hardcoded component colours.
- Inspect the code and the relevant section of [the marketing runbook](Resources/marketing-runbook.md) for the task at hand. The runbook records implementation history and dated operational facts; current code and live configuration take precedence.
- Verify affected pages with `pnpm build`. For layout changes, check the 375 CSS px mobile viewport and the changed desktop layout. Run focused checks where the repository provides them; no general test, lint, or format command is configured.
- Use British English in public copy. Internal links are root relative. Update the `lastUpdated` value in `/privacy` or `/cookies` when changing their substance.

## Where things live

- `src/pages/`: page copy and structure. `src/components/`: shared Astro components and the enquiry form island.
- `src/config/`: pricing, checkout, feature flags, security tables, support content, statutory timeline, and page data. Reuse these sources instead of repeating values in prose.
- `src/scripts/`: browser enhancements. `functions/api/`: Cloudflare Pages Functions. Keep related client and server copies in sync where they deliberately cannot share an import.
- `public/_headers`: Content Security Policy and caching. `public/_redirects`: permanent route redirects.
- `Resources/marketing-runbook.md`: detailed notes for checkout, email, security, video, privacy, SEO, Docker, and deployment. Read only the sections relevant to the change.

## Contracts that affect multiple files

- **Privacy and external requests:** Fleetlix installs no analytics, marketing tags, or tracking pixels, and no third-party widgets load automatically. `/cookies` promises this. Two documented exceptions require an explicit visitor action: the walkthrough's Supabase MP4, played using native `<video>`, and the Whereby iframe on `/training`, loaded only after the visitor reads its privacy/cookie notice and presses **Enter training room**. Whereby has its own privacy and cookie practices inside the room. Check the runbook's *Privacy*, *Walkthrough video*, and *Live training room* sections before changing these behaviours.
- **CSP:** Client scripts intentionally import a shared module so Astro emits external `/_astro/*.js` files covered by `script-src 'self'`. Avoid making them inline. JSON-LD and Astro runtime hashes in `public/_headers` can change when structured data, the walkthrough poster, or Astro changes. Follow the runbook's *CSP and security headers* section when those files change.
- **Security document:** `/security` uses `src/pages/security.astro` and `src/config/security.ts`; its downloadable PDF is `public/fleetlix-app-and-data-security.pdf`. Keep their claims aligned, bump `DOC.version` and issue date for substantive changes, rebuild and inspect the PDF, and update `DOC.pdfPages` if needed. The PDF generator is in the operations repository and may lag the current OpenAI copy; check it before regenerating. Preserve section 19, *What we do not claim*, until a claim actually stops being true.
- **Legal and support copy:** `/support` explains the contract in `/terms-of-service`; cancellation and refund wording must agree across both and the `/thank-you` order summary. `/support` is the URL printed on Stripe receipts and must remain reachable. The published contact address must actually route before changing it.
- **Pricing and checkout:** `src/config/pricing.ts` supplies marketing prices; compare term prices against the app with `scripts/check-term-prices.ts` before editing them. `SALES_PAUSED` and `BROKER_PRO_EARN_ONLY` each have a client copy in `src/config/checkout.ts` and a server copy in `functions/api/checkout.ts`; change both sides together. Promo rules are also duplicated across those files. The app is the authority for billing and provisioning. Do not offer a checkout path that the app cannot fulfil. See the runbook's *Sales pause*, *Promo checkout pipeline*, and *Broker Network* sections.
- **Checkout handoff:** Stripe returns to `/thank-you`; its “Create your login” link forwards the `session_id` to `fleetlix.app/onboarding`. Keep that parameter. `functions/api/checkout-session.ts` returns a narrow summary rather than a raw Stripe session.
- **Enquiries:** `InterestForm` and `functions/api/register-interest.ts` share allowed select values. Keep them aligned. The delivery path is Pages Function → Resend → `contact@fleetlix.com` via Cloudflare Email Routing. The Docker/nginx production image is only a static mirror; Pages Functions and `public/_headers` run on Cloudflare, not in that container.
- **DWTS:** The homepage timeline and `/digital-waste-tracking` share `src/config/dwts.ts`. Verify statutory dates and figures against primary sources before editing, and update its `lastUpdated` value for substantive changes. Do not present Fleetlix's Phase 1 approval as Phase 2 approval.
- **Mobile:** The page must not scroll horizontally. Keep `overflow-x: clip` on `html` and `body`; clip decorative bleed within its section. Avoid `100vw` for full-width layouts, respect safe areas, and keep touch targets at least 44 by 44 CSS px.

## Delivery boundaries

Work through the requested change and its direct validation. When the user requests a change to privacy, security headers, billing, or deployment, proceed within that scope and make its effects reviewable. For an unrequested new third-party request, material privacy commitment, or rewrite of published Git history, obtain the owner's decision first.
