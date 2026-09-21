# Putting the term-contract signup on fleetlix.com

Written for whoever builds the marketing site's signup — a front-end developer
working in the **Fleetlix-Marketing** repository, who has not seen the app repo.

Everything this plan needs from the app side **is built on `feat/term-contracts-billing`
and applied to the Staging environment (`rwvsiluzkngdkduihtji`)**. Option A is already
drafted on branch `feat/term-contract-picker` in this repository. What remains is
marketing-repo review, Cloudflare settings, and turning `SHOW_TERM_CONTRACTS` on once
the app side and legal pack are live.

---

## 1. What already exists, so you don't rebuild it

The app at `fleetlix.app` owns the whole contract journey:

| Step | Where it lives | Who owns it |
|---|---|---|
| Choose a tier and a term | `/subscribe` (and a `TermPicker` on marketing) | **Either** |
| Fill in the company, addresses and signer | `/subscribe` | **Either** |
| Confirm the email with a one-time code | `/contract/:token` | **App only** |
| Read the Order Form PDF and sign it | `/contract/:token` | **App only** |
| Receive the signed PDF and invoice 1 | Email (Resend) | App |
| Pay by bank transfer; the account is created | Bank feed → provisioning | App |

**The signing half is never rebuilt on the marketing site.** It captures legal
evidence — a one-time code, the IP, the user agent, the signature image, and the
SHA-256 of both documents — and stores it in an append-only table behind an R2
bucket lock. A second implementation of that is a second thing to get wrong on
the one page where being wrong is expensive.

So the only real question is how far into the journey the marketing site goes.

---

## 2. Three options. Take A first; B is the upgrade

### Option A — the picker links across (recommended to start)

The marketing site renders the price ladder and the term chooser, and links to:

```
https://fleetlix.app/subscribe?plan=depot&term=36
```

`/subscribe` already reads both query parameters and preselects them
(`PublicSubscribe.tsx`). `plan` is one of `operator`, `workshop`, `depot`,
`haulier`, `network`, plus `broker_pro`; `term` is `24`, `36`, `48` or `60`.

- **Cost:** a link. No API call, no CORS, no form validation to mirror.
- **Trade-off:** the buyer crosses to another domain mid-journey. `fleetlix.app`
  is visibly Fleetlix, so this is a seam rather than a leak, but it is a seam.
- **Do this first even if you intend B.** It proves the prices, the picker and
  the analytics before anything can fail in a browser's preflight.

### Option B — the marketing site owns the form

The marketing site renders the whole order form and posts it; the buyer only
crosses over to sign. This is what §3 documents.

- **Cost:** you reimplement the form, its validation messages and its law
  callout. Expect a day, plus care.
- **Trade-off, and it is the real one:** there are now **two** order forms. They
  agree until somebody edits one. Mitigate with the parity check in §6.

### Option C — the marketing site owns signing too

**Don't.** See §1.

---

## 3. The API, exactly

### `GET https://fleetlix.app/api/plans`

The published price list, generated from the same `shared/plans` the product
gates on. **Already `Access-Control-Allow-Origin: *`** — it is a price list on a
website — and cached five minutes at the edge. Render this rather than
hand-writing prices: a hand-written table agrees with the product right up until
somebody edits one of them, and the half that goes stale is the public half.


### `GET https://fleetlix.app/api/subscribe/company?number=12345678`

The Companies House lookup used by the order form. Returns `{ kind: "found", company: { name, address, postcode, nation }, problem? }` or `{ kind: "not_found"|"invalid"|"unavailable" }`.
CORS-enabled for origins on `CONTRACT_SIGNUP_ORIGINS`. Use this in Option B to autofill registered office details as the buyer types their company number.

### `POST https://fleetlix.app/api/subscribe`

`Content-Type: application/json`. No authentication — the buyer has no Fleetlix
login until invoice 1 is paid.

```jsonc
{
  "plan": "depot",                  // operator|workshop|depot|haulier|network|broker_pro
  "term": 36,                       // 24|36|48|60
  "entityType": "limited_company",  // or "sole_trader"
  "legalName": "Acme Skips Ltd",
  "tradingName": null,
  "companyNumber": "01234567",      // limited companies only
  "vatNumber": null,
  "registeredAddress": "1 Registered Row, Leeds",
  "registeredPostcode": "LS1 1AA",
  "registeredNation": "england",    // england|wales|scotland|northern_ireland
  "tradingAddress": "2 Yard Lane, Leeds",
  "tradingPostcode": "LS1 2BB",
  "tradingNation": "england",
  "billingEmail": "accounts@acme.example",
  "signerName": "Jo Bloggs",
  "signerEmail": "jo@acme.example",
  "signerTitle": "Director",
  "confirmAuthority": true,         // must be true
  "acceptEmail": true               // must be true
}
```

**201** → `{ "token": "…", "next": "verify_email" }`

Send the buyer to `https://fleetlix.app/contract/<token>` immediately. A
verification code is already on its way to `signerEmail` via Resend.

**Failures** — every one carries a sentence meant to be shown as written:

| Status | Body | What to do |
|---|---|---|
| 400 | `{ error, fields: { companyNumber: "…" } }` | Put each `fields` entry under its input; show `error` at the top |
| 422 | `{ error, code?, fields? }` | A real refusal (Companies House disagrees, a partnership, outside the UK). Show it |
| 429 | `{ error, code: "rate_limited" }` + `Retry-After` | Five signups per IP per hour. Say how long |
| 503 | `{ error, missing: […] }` | The deployment is not configured. Show "not switched on yet", and tell Christopher |

⚠️ **Show `error` verbatim.** These sentences were written to be read by the
buyer — "Companies House registers this company in Northern Ireland" tells them
what to fix; "Something went wrong" does not.

### The law is decided for them, not by them

For a limited company the **registered office** decides the governing law; for a
sole trader, the **trading address**. Three systems: England and Wales, Scotland
and Northern Ireland. Say which one before they submit — `/subscribe` renders a
line like *"Your contract will be under Scots law, from your registered
office."* Do the same, or the first they learn of it is a PDF.

---

## 4. The two Cloudflare settings (Option B only)

A browser will not let `fleetlix.com` post to `fleetlix.app` unless the app says
so. On the **Fleetlix app** Pages project:

```
CONTRACT_SIGNUP_ORIGINS = https://fleetlix.com,https://www.fleetlix.com
```

Then redeploy. Add the marketing preview origin too if you want to test there.

⚠️ **It is an allowlist and never a wildcard.** `/api/subscribe` is
unauthenticated by necessity, so `*` would let any page on the internet drive
the order form, and the first a real business would know of it is a contract in
their name. An origin not on the list gets no `Access-Control-Allow-Origin`
header at all and the browser stops there. **Unset means same-origin only**, so
the symptom of forgetting this step is that the form fails in the browser — not
that it quietly works for everybody.

`signupCors.test.ts` in the app repo asserts both directions.

---

## 5. Build order

1. **Render the ladder from `/api/plans`.** Ship it. Nothing below can break it.
2. **Add the term picker** (24/36/48/60 with the discount) behind the existing
   `SHOW_TERM_CONTRACTS` flag. Link to `/subscribe?plan=…&term=…` — that is
   Option A, and it is shippable on its own.
3. **Only then, if you want B:** build the form, set
   `CONTRACT_SIGNUP_ORIGINS`, and post. Keep the Option A link as the fallback
   for any browser that refuses the request.
4. **Turn `SHOW_TERM_CONTRACTS` on** only once the app side is live —
   `Resources/term-contracts-go-live.md`. Until then the page advertises a door
   that answers 503.

---

## 6. What will go wrong, and the cheap guard for each

- **Two price lists.** The marketing repo already has a parity script (build
  notes §6, "Marketing ↔ app price parity"). Run it in marketing CI. If you take
  Option B, extend it to the tier and term *names* the form posts — a form
  offering `enterprise` gets a 400 nobody reads.
- **A 503 that looks like a bug.** Before the app side is live, every submit
  answers 503 with a `missing` list. Keep the flag off.
- **A CORS failure that looks like the API being down.** In the browser console
  it says so explicitly; in your error reporting it will read as a network
  error. Log the response status separately from the network failure so the two
  are distinguishable.
- **Northern Ireland.** The form accepts it, and the app will refuse a **live**
  Northern Irish order until a Northern Irish MSA is approved. That refusal
  arrives as a 409 at signing, not at signup. If no NI agreement is approved
  yet, either leave Northern Ireland out of the nation list or expect that
  refusal and word the page for it.
- **The buyer closing the tab after submitting.** Their token is emailed to
  them; they can resume. Say so on the hand-off screen.
