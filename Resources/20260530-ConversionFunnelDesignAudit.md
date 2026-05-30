-----

title: Fleetlix Marketing Site — Conversion Funnel Design Audit
created: 2026-05-24
type: research
tags:

- fleetlix
- web-design
- research
- conversion
  status: draft
  project: Fleetlix

---

--

# Fleetlix Marketing Site — Conversion Funnel Design Audit

> [!summary]
> The marketing site is visually strong and technically clean, but in its current pre-launch state (`SHOW_PRICING` and `SHOW_CONTACT` both `false`) the path from a visitor landing to a registered lead has four real breaks. The biggest: there is no conversion action above the fold and no navigation at all on mobile, so a ready-to-act visitor on a phone has nothing to tap. None of the fixes are large; most are an hour or two of work.

## Context

The question being answered: across the live marketing site and its code, what can be adjusted to improve the physical design of the journey from operator-lands-on-site to operator-registers-interest, on both mobile and desktop.

This audit follows the Framework Method — familiarisation, thematic framework, indexing, charting, interpretation — so the findings are reproducible rather than a loose list of opinions.

## Familiarisation — the funnel as it actually renders

With both feature flags off, `index.astro` renders this sequence:

1. **Header** — sticky, logo only. Nav is `hidden md:flex`, so it appears on desktop only; the “Book a demo” button is gated behind `SHOW_CONTACT` and is therefore absent everywhere.
1. **Hero** — headline, sub-copy, one button (“See how it works” → `#product`), a two-stat list, and an image panel on the right.
1. **FeatureGrid** — six product-area cards.
1. **WhyPwa** — dark section, three numbered points.
1. **WhoFor** — three audience cards.
1. **InterestForm** — dark section with the “Register your interest” button; clicking it opens a modal containing the actual form.
1. **SiteFooter**.

The `CtaFooter` section is gated off. So the _entire_ conversion mechanism is one button two-thirds of the way down the page, plus the modal behind it.

## Thematic framework — the five lenses

The audit indexes every observation against one of five themes:

- **Wayfinding** — can a visitor find their way to the action?
- **The ask** — is the conversion action visible, single, and well-pitched?
- **The form interaction** — how much friction sits between intent and submission?
- **Reliability of the connection** — once submitted, does the lead reliably reach Christopher, and does the operator get acknowledged?
- **Legibility and responsiveness** — does the design hold up on a phone and on a desktop?

## Findings

### Wayfinding

> [!warning] Critical
> On mobile there is no navigation whatsoever. The header `<nav>` is `hidden md:flex`, and there is no hamburger or mobile menu to replace it. Below 768px the header is a logo on an empty bar. A phone visitor cannot jump to Product, Why a PWA, or Who it’s for — they can only scroll, and they have no way back up.

The sticky header also has no scroll offset. It is `sticky top-0 z-40` and roughly 70px tall, but there is no `scroll-margin-top` on the anchored sections and no `scroll-padding-top` on `html`. Every nav anchor (`#product`, `#why-pwa`, `#who`) scrolls the target so its heading sits _underneath_ the header. This affects desktop and mobile equally.

Anchor jumps are also instant — `scroll-behavior: smooth` is not set in `global.css`.

### The ask

> [!warning] Critical
> There is no conversion action above the fold. The hero’s only button is “See how it works”, which scrolls to the feature grid. The real “Register your interest” button lives inside the `InterestForm` section, four sections down. A visitor who is convinced by the hero alone has nowhere to act and must scroll through three more sections to find one.

The hero’s single button is also styled as a _secondary_ control — white background, mist border. It reads that way because it was designed as the quiet partner to the now-hidden cyan “Book a demo”. With its sibling gone, the hero’s only call to action looks deliberately de-emphasised.

The pitch in the `InterestForm` copy is good — “first five operators”, “pilot pricing”, “case-study rights” creates real scarcity. The problem is purely placement and visibility, not message.

### The form interaction

The single most important action on the site is gated behind a modal: click “Register your interest”, wait for the modal, then fill the form. Every interaction step between intent and submission costs a percentage of people. On desktop there is ample room to render the form inline beside the copy and remove the click entirely; the modal pattern earns its place on mobile, not on a wide screen.

The modal itself is well built — bottom-sheet on mobile, centred on desktop, body-scroll lock, `prefers-reduced-motion` handled, proper labels and `aria-describedby` on errors. Two gaps remain:

- It uses `max-h-[92vh]`. On iOS Safari, `vh` does not shrink when the keyboard opens, so the lower fields and the submit button can be pushed off-screen behind the keyboard. `dvh` (dynamic viewport height) is the correct unit.
- There is no focus trap. Initial focus, Escape-to-close, and focus restoration are all handled, but `Tab` is not contained — keyboard focus can leave the dialog and land on the page behind it.

The field set (name and email required; company, fleet size, role, message optional; consent required) is reasonable for interest capture. Fleet size is the most commercially useful field because it maps directly to a pricing tier — worth making it visually prominent even while optional.

### Reliability of the connection

> [!warning] Critical
> Leads are captured by email only, with no persistence. `register-interest.ts` validates the payload and sends it via Resend; submissions are explicitly not stored. If a Resend send fails after retry, or an email is filtered or lost, that lead is gone permanently. During a pre-launch whose entire goal is the _first five operators_, every lead is high-value and losing one is expensive.

The fix is a backstop write — append each submission to a Supabase table or Cloudflare KV _before or alongside_ the email send, independent of delivery success. The stack already has Supabase wired in.

There is also no acknowledgement to the operator. The modal shows a success state, but nothing arrives in their inbox. A short confirmation email would reassure them the submission landed, verify the address is real, and keep Fleetlix warm in their inbox until launch. Right now the connection is one-directional.

### Legibility and responsiveness

Several text colours on the dark (graphite) sections sit below comfortable contrast: the hero/modal microcopy at `text-white/55`, and form placeholders at `text-white/30`. On the espresso background these are hard to read and the placeholder colour fails WCAG AA. Lifting body and microcopy to `white/70` or higher is a small change with a real legibility gain on both devices.

Minor: the modal close button is `p-2` around a 20px icon — roughly a 36px target, just under the 44px touch-target guideline.

The responsive structure is otherwise sound — `md:grid-cols-12` hero collapses cleanly, the image panel has an `onerror` fallback, the above-fold image is `loading="eager"`, and section padding is consistent.

## Charting — prioritised actions

| Priority | Fix                                                                              | Theme       | Effort |
| -------- | -------------------------------------------------------------------------------- | ----------- | ------ |
| Critical | Add a mobile nav (hamburger or a simple anchor row)                              | Wayfinding  | S      |
| Critical | Add a primary CTA in the hero linking to `#register-interest`                    | The ask     | S      |
| Critical | Add `scroll-margin-top` to anchored sections (or `scroll-padding-top` on `html`) | Wayfinding  | XS     |
| Critical | Persist each submission to Supabase or KV as a backstop to email                 | Reliability | M      |
| High     | Render the interest form inline on desktop; keep the modal for mobile            | The form    | M      |
| High     | Lift low-contrast text (`white/55`, `white/30`) to `white/70`+                   | Legibility  | XS     |
| High     | Switch modal `max-h` from `vh` to `dvh`                                          | The form    | XS     |
| High     | Send a confirmation email to the registrant                                      | Reliability | S      |
| Medium   | Promote the hero’s lone button to primary styling                                | The ask     | XS     |
| Medium   | Add a focus trap to the modal                                                    | The form    | S      |
| Medium   | Add cookieless analytics so the funnel is measurable                             | Reliability | S      |
| Low      | Enlarge the modal close button to a ~44px target                                 | Legibility  | XS     |
| Low      | Set `scroll-behavior: smooth`                                                    | Wayfinding  | XS     |

## Implications

The recurring pattern is that the feature flags did their job for _pricing_ but quietly hollowed out _contact_. Turning off `SHOW_CONTACT` removed the “Book a demo” buttons in the header and hero — and nothing replaced them. The result is a site whose visual design is premium but whose conversion mechanism is a single mid-page button. The page is doing the _brand_ job well and the _capture_ job poorly.

The highest-leverage move is the smallest: a single primary “Register your interest” button in the hero, pointed at `#register-interest`, plus a minimal mobile nav. That alone restores an above-the-fold path to the action on every device. The Supabase backstop is the most important non-visual fix — it protects the leads the rest of the work is designed to generate.

> [!tip]
> A useful rule for the pre-launch flags: whenever a CTA is hidden, something must take its slot. A flag should swap the call to action, never delete it.

## Open questions

> [!question]
>
> - Should the desktop experience drop the modal entirely in favour of an always-visible inline form, or keep the modal as a secondary entry point?
> - Is a cookieless analytics tool (e.g. Cloudflare Web Analytics, which sets no cookies and would not change the current cookie policy) acceptable, given the deliberate no-tracking stance?
> - When pricing returns at launch and `SHOW_CONTACT` flips back on, does the header want both a nav and a CTA on mobile, or a condensed menu?

## Related

- [[Fleetlix Blueprint]]
- [[Fleetlix Plan of Action]]
- [[Framework Method]]
