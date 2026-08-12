// Walkthrough page config — the chapter list and the Cloudflare Stream binding.
//
// Consumed by src/pages/walkthrough.astro only. It lives here rather than in the
// page for one reason: the chapters are BOTH the visible, indexable content and
// the seek targets the player script uses, so they must come from one array or
// the two silently drift the first time a chapter is retimed.
//
// THE RECORDING EXISTS; THE STREAM BINDING DOESN'T YET. `hasVideo` stays false
// until both env vars are set, and everything that would be a lie without a
// playable video (the play button, the seek buttons, the VideoObject structured
// data) is withheld rather than faked. Publishing is two env vars in Cloudflare
// Pages and a redeploy — no code change, no CSP change.
//
// The timestamps below are MEASURED against the delivered cut — 30fps, checked
// against the file's own CHAPTERS — not planned, so every seek target is real.
// If the video is ever re-edited, retime them in the same pass: a chapter button
// that seeks to the wrong moment is worse than no chapter list at all.

import { DWTS_MILESTONES } from "./dwts";

// The Digital Waste Tracking chapter quotes statutory dates, and this site keeps
// every one of those in ONE place — src/config/dwts.ts, where each figure traces
// to a primary source. Typing "Oct 2026 / Jan 2027" into a blurb here would put
// a second copy in the codebase that nothing keeps honest, and Northern
// Ireland's date is an ACTIVE source conflict (GOV.UK moved it to January 2027
// on 5 August 2026, having previously been reported as October 2026). If it
// moves again, dwts.ts gets corrected and this chapter follows automatically.
//
// Throwing on a missing id is deliberate: renaming a milestone should break the
// build loudly, not render "undefined (undefined)" on a page a buyer is reading.
const milestone = (id: string) => {
  const found = DWTS_MILESTONES.find((m) => m.id === id);
  if (!found) throw new Error(`walkthrough: unknown DWTS milestone id "${id}"`);
  return found;
};

const phase1EW = milestone("phase-1-ew");
const phase1ScotNI = milestone("phase-1-scot-ni");

/**
 * Astro exposes build-time env on `import.meta.env`, but its generated
 * ImportMetaEnv only types the vars it knows about, so read through a cast
 * rather than adding a global declaration for two optional strings.
 */
const env = import.meta.env as unknown as Record<string, string | undefined>;

/** Cloudflare Stream video UID. Empty until the recording is uploaded. */
export const STREAM_UID = env.PUBLIC_STREAM_UID ?? "";

/** Cloudflare Stream customer code — the `customer-<code>` subdomain. */
export const STREAM_CUSTOMER_CODE = env.PUBLIC_STREAM_CUSTOMER_CODE ?? "";

/**
 * The iframe origin. Must stay in sync with the `frame-src` entry in
 * public/_headers — the CSP there allows `https://*.cloudflarestream.com`, so
 * any customer code works without a header edit, but a DIFFERENT video host
 * would be blocked outright.
 */
export const STREAM_ORIGIN = STREAM_CUSTOMER_CODE
  ? `https://customer-${STREAM_CUSTOMER_CODE}.cloudflarestream.com`
  : "";

/**
 * Both halves are required — a UID without a customer code (or the reverse)
 * builds an origin that 404s. Everything video-shaped on the page keys off this.
 */
export const hasVideo = Boolean(STREAM_UID && STREAM_ORIGIN);

/**
 * Total runtime of the delivered cut. Printed whether or not the video is live:
 * it is now a measured fact about a finished recording, and while publication is
 * pending it is the detail that makes the page read as "this exists and is
 * coming" rather than "this is vapour". Not derivable from the Stream API at
 * build time, so re-check it if the video is ever re-cut.
 */
export const RUNTIME_LABEL = "10:39";

export interface Chapter {
  /** Seek target, whole seconds from the start. */
  at: number;
  label: string;
  /**
   * One line on what the viewer actually sees. This is what makes the page
   * worth indexing before the video is transcribed — a chapter list of bare
   * labels is navigation; a chapter list with these is content.
   */
  blurb: string;
}

export const chapters: Chapter[] = [
  {
    at: 0,
    label: "Why this exists",
    blurb: "One job touched six times, on paper, by four people.",
  },
  {
    at: 29,
    label: "One app, every role",
    blurb:
      "Office, drivers, the yard and the workshop sign in to the same app — and land on the screen their job actually starts from.",
  },
  {
    at: 51,
    label: "The Attention board",
    blurb:
      "Not a dashboard. Everything needing a decision today, grouped and ranked. Sources with nothing outstanding aren't shown.",
  },
  {
    at: 85,
    label: "The jobs console",
    blurb:
      "Every job in one grid, filtered and searched in the database — so it's just as quick with half a million jobs in it.",
  },
  {
    at: 127,
    label: "Planning the day",
    blurb:
      "Drag a job onto a driver's lane. The phone in their cab updates before you've let go.",
  },
  {
    at: 172,
    label: "The driver's check",
    blurb:
      "The DVSA walk-around on a phone. A failed tyre becomes a work order in the workshop before the driver puts the phone down.",
  },
  {
    at: 207,
    label: "The run, and the proof",
    blurb:
      "Run sheet with navigate, call and WhatsApp on the row. Then a photo, a signature and a timestamp — attached to the job.",
  },
  {
    at: 259,
    label: "The weighbridge",
    blurb:
      "Gross in, tare out, net computes itself — and lands on the job, the transfer note, the invoice and the Defra filing at once.",
  },
  {
    at: 316,
    label: "Waste transfer notes",
    blurb:
      "Generated from what the driver and the weighbridge already recorded. Signed in a batch at a desk, not one at a time.",
  },
  {
    at: 373,
    label: "Digital Waste Tracking",
    // Dates interpolated from src/config/dwts.ts — see the note above that
    // import for why they are never typed by hand on this site.
    blurb: `Mandatory ${phase1EW.shortLabel} (${phase1EW.nations}), ${phase1ScotNI.shortLabel} (${phase1ScotNI.nations}). Filed automatically, by the second-working-day deadline.`,
  },
  {
    at: 410,
    label: "Invoicing",
    blurb:
      "Each line carries its weighbridge ticket, weight and EWC code — what the customer's accounts team matches against.",
  },
  {
    at: 443,
    label: "Cash and credit",
    blurb:
      "You find out an account is over its limit before you send a lorry, not after.",
  },
  {
    at: 468,
    label: "What the customer sees",
    blurb:
      "A tracking link in your name and colours. An arrival window, not a promise to the minute.",
  },
  {
    at: 501,
    label: "The account portal",
    blurb:
      "Bigger accounts get their own login. A site contact sees their site and no money at all.",
  },
  {
    at: 545,
    label: "Running the business",
    blurb:
      "Team, plan and paperwork. Drivers sign in with a pairing code and a PIN — no company email, no password in a cab.",
  },
  {
    at: 575,
    label: "The numbers",
    blurb:
      "Jobs, revenue, tonnage, and how much you kept out of landfill.",
  },
];

/** 585 → "9:45". Whole seconds in, mm:ss out. */
export const fmtTime = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
