// Walkthrough page config — the chapter list and the Cloudflare Stream binding.
//
// Consumed by src/pages/walkthrough.astro only. It lives here rather than in the
// page for one reason: the chapters are BOTH the visible, indexable content and
// the seek targets the player script uses, so they must come from one array or
// the two silently drift the first time a chapter is retimed.
//
// THE VIDEO DOES NOT EXIST YET. The page is built to ship before it does:
// `hasVideo` is false until both env vars are set, and everything that would be
// a lie without a video (the runtime, the play button, the seek buttons, the
// VideoObject structured data) is withheld rather than faked. Dropping the video
// in is two env vars in Cloudflare Pages and a redeploy — no code change.
//
// ⚠ RETIME THE CHAPTERS AGAINST THE FINAL CUT. The timestamps below are the
// plan for the recording, not measurements of it. A chapter button that seeks to
// the wrong moment is worse than no chapter list, so check every `at` against
// the delivered file before announcing the page.

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
 * Total runtime, shown on the facade and in the eyebrow. Only rendered when
 * `hasVideo` — quoting a duration for a video nobody can play is the kind of
 * detail that reads as carelessness. Set it to the real figure when the cut is
 * locked; it is not derivable from the Stream API at build time.
 */
export const RUNTIME_LABEL = "10:24";

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
    label: "Signing in and the yard board",
    blurb:
      "Where the day starts: today's jobs, who is on shift, and which vehicles are off-road before anyone has picked up a phone.",
  },
  {
    at: 72,
    label: "Booking a job",
    blurb:
      "Taking a skip order on the phone — customer, address, waste type and price captured once, in the fields the paperwork later reads from.",
  },
  {
    at: 195,
    label: "Assigning a driver and vehicle",
    blurb:
      "Dragging the job onto a driver's lane on the dispatch board, and what the driver sees on their phone the moment it lands.",
  },
  {
    at: 310,
    label: "The driver app on a phone",
    blurb:
      "The run sheet, the DVSA walk-around check, and what happens to the job when the signal drops halfway down a farm track.",
  },
  {
    at: 425,
    label: "Signature capture and PODs",
    blurb:
      "Proof of delivery on the driver's screen — photos, signature, timestamp — attached to the job rather than to a glovebox.",
  },
  {
    at: 520,
    label: "Waste transfer notes and DWTS",
    blurb:
      "The Waste Transfer Note generated from data already captured, and the same movement submitted to Defra's Digital Waste Tracking Service.",
  },
  {
    at: 585,
    label: "Invoicing and month end",
    blurb:
      "Turning completed jobs into invoices, and the export the bookkeeper actually wants at the end of the month.",
  },
];

/** 585 → "9:45". Whole seconds in, mm:ss out. */
export const fmtTime = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
