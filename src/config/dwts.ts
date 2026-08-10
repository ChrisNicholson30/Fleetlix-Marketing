// Single source of truth for everything the site says about the UK Digital
// Waste Tracking Service (DWTS).
//
// Consumed by:
//   1. src/components/DwtsTimeline.astro — the live timeline rendered on the
//      homepage and again, in full, on the guide page.
//   2. src/pages/digital-waste-tracking.astro — the guide's prose and its
//      Article + FAQPage JSON-LD.
//
// Rule: every date and figure below is traceable to a primary source — an SI on
// legislation.gov.uk, Defra's DWTS policy paper, the Scottish BRIA, or Defra's
// developer hub. Where the primary sources genuinely conflict (Northern
// Ireland's mandatory date does) the conflict is stated on screen rather than
// smoothed over. Operators plan capital spend against these dates, so an
// invented deadline is worse than no page at all.
//
// The status of each milestone is NOT stored here — it is derived from the
// date, at build time by `milestoneStatus()` and again in the browser by
// src/scripts/dwts-timeline.ts. That way a build that goes stale over a
// deadline still shows the truth to whoever is reading it.

export type MilestoneStatus = "done" | "current" | "future";

/**
 * The word printed against each milestone. Imported by both the component
 * (build-time render) and src/scripts/dwts-timeline.ts (live re-render), so a
 * milestone can never be described one way on load and another a second later.
 */
export const STATUS_LABEL: Record<MilestoneStatus, string> = {
  done: "Live",
  current: "Next up",
  future: "Ahead",
};

export interface DwtsMilestone {
  id: string;
  /**
   * The instant used for maths (rail fill, countdown, "you are here").
   * Where Defra has only committed to a season, this is the modelled point
   * inside it and `approximate` flags that on screen.
   */
  iso: string;
  approximate?: boolean;
  /** Full date as written in copy, e.g. "1 October 2026". */
  dateLabel: string;
  /** Compact label for the rail node, e.g. "Oct 2026". */
  shortLabel: string;
  title: string;
  /** Who it binds, in one short phrase — printed as a badge on the node. */
  nations: string;
  phase: 1 | 2;
  body: string;
  /** Set where the primary sources disagree; rendered as a visible caveat. */
  caveat?: string;
}

/**
 * The statutory timeline. Chronological — the rail, the countdown and the
 * "you are here" marker all assume this array is sorted by `iso`.
 */
export const DWTS_MILESTONES: DwtsMilestone[] = [
  {
    id: "public-beta",
    iso: "2026-04-28T00:00:00Z",
    dateLabel: "28 April 2026",
    shortLabel: "Apr 2026",
    title: "Public beta opens",
    nations: "UK-wide",
    phase: 1,
    body: "Defra's Report receipt of waste service opened to every permitted receiving site. Voluntary, with no penalties for mistakes — the soft-landing window before the duty bites.",
  },
  {
    id: "phase-1-ew",
    iso: "2026-10-01T00:00:00Z",
    dateLabel: "1 October 2026",
    shortLabel: "Oct 2026",
    title: "Receiving sites must file",
    nations: "England & Wales",
    phase: 1,
    body: "Every permitted or licensed site that receives waste must record each load digitally and obtain a Waste Tracking ID. Enforced by the Environment Agency in England and Natural Resources Wales in Wales.",
  },
  {
    id: "phase-2-private-beta",
    iso: "2026-11-01T00:00:00Z",
    approximate: true,
    dateLabel: "Autumn 2026",
    shortLabel: "Autumn 2026",
    title: "Carrier beta opens, by invitation",
    nations: "Invited operators",
    phase: 2,
    body: "Defra begins private-beta testing of the Phase 2 carrier leg with invited operators and software providers. No exact day has been published.",
  },
  {
    id: "phase-1-scot-ni",
    iso: "2027-01-01T00:00:00Z",
    dateLabel: "1 January 2027",
    shortLabel: "Jan 2027",
    title: "Receiving sites must file",
    nations: "Scotland & N. Ireland",
    phase: 1,
    body: "The same duty reaches Scotland under SSI 2026/145, enforced by SEPA, and Northern Ireland under DAERA. Scotland calls hazardous waste Special Waste, and the service uses that term too.",
    caveat:
      "Northern Ireland's date is a genuine source conflict: GOV.UK's policy paper, updated 5 August 2026, says January 2027, but earlier coverage grouped Northern Ireland with England and Wales at October 2026. We follow the most recent primary source.",
  },
  {
    id: "phase-2-public-beta",
    iso: "2027-04-01T00:00:00Z",
    approximate: true,
    dateLabel: "Spring 2027",
    shortLabel: "Spring 2027",
    title: "Carrier beta opens to everyone",
    nations: "UK-wide",
    phase: 2,
    body: "Any carrier, broker or dealer can start filing voluntarily, ahead of the mandate. The sensible moment to get your drivers used to capturing the data.",
  },
  {
    id: "phase-2-mandatory",
    iso: "2027-10-01T00:00:00Z",
    approximate: true,
    dateLabel: "October 2027",
    shortLabel: "Oct 2027",
    title: "Carriers, brokers and dealers must file",
    nations: "UK-wide",
    phase: 2,
    body: "Phase 2 becomes mandatory for carriers, brokers, dealers, exempt waste operations and exporters. This is the one that catches most skip-hire, tipper and bulker firms — and the earliest the temporary spreadsheet route may be withdrawn.",
    caveat:
      "Defra has confirmed October 2027, but the detailed statutory instrument had not been laid as of August 2026, so the exact day and the precise scope may still move.",
  },
];

/** Where Fleetlix itself has got to. Ordered oldest first, same as the law. */
export interface FleetlixStage {
  id: string;
  when: string;
  title: string;
  body: string;
  state: "done" | "active" | "planned";
}

export const FLEETLIX_STAGES: FleetlixStage[] = [
  {
    id: "built",
    when: "June 2026",
    title: "Phase 1 integration built",
    body: "The Receipt of Waste API wired end to end: OAuth 2.0 against Defra's identity service, all five reference-data lists synced, movements created and corrected, and an API code held per permitted site so a multi-site operator files under the site that actually took the load.",
    state: "done",
  },
  {
    id: "proven",
    when: "June 2026",
    title: "Proven against Defra's test service",
    body: "A full round trip confirmed on Defra's external test environment — a real Waste Tracking ID returned for clean loads, hazardous loads, persistent organic pollutants, and the hardest combined case. Tracking IDs are issued by Defra, so they cannot be faked.",
    state: "done",
  },
  {
    id: "pat",
    when: "July 2026",
    title: "13 of Defra's 14 approval scenarios passed",
    body: "Defra sets fourteen production approval tests a provider must demonstrate before going live. Thirteen pass. The fourteenth is an open query we raised with Defra on 7 July 2026, where the test service accepts a movement its own scenario says it should reject.",
    state: "done",
  },
  {
    id: "deadline-clock",
    when: "August 2026",
    title: "The two-working-day clock, tracked for you",
    body: "Every received load gets a filing deadline the office can see, counted in working days on a UK clock, with anything approaching it raised on the attention board. Rate limits and Defra outages retry themselves instead of landing in your lap as an error.",
    state: "done",
  },
  {
    id: "production",
    when: "Waiting on Defra",
    title: "Production credentials, with Defra",
    body: "There is no code left to write for Phase 1. Going live needs Defra to issue production credentials, and each operator to register for Report receipt of waste in their own name to get their API code — a fee only the operator can pay.",
    state: "active",
  },
  {
    id: "phase-2",
    when: "Ahead of October 2027",
    title: "Phase 2 carrier capture",
    body: "The collection leg — producer details, collection times, the waste hierarchy and the intended treatment — captured by the driver at the kerb, offline if there is no signal. Much of it already exists in Fleetlix for other reasons; Phase 2 connects it to Defra once the API is published.",
    state: "planned",
  },
];

/**
 * Figures quoted in more than one place. Keeping them here means the guide and
 * the FAQ can never quote different numbers for the same thing.
 */
export const DWTS_FACTS = {
  /** Per legal entity that creates or edits records, per year. */
  fee: "£26",
  /** England, Digital Waste Tracking (England) Regulations 2026, Schedule 2. */
  fixedPenalty: "£1,000",
  filingWindow: "the end of the second working day after the day of receipt",
  siteOperators: "12,000",
  exemptionHolders: "150,000",
  carriersBrokersDealers: "300,000",
  microShare: "71.5%",
  smallShare: "21.5%",
  wasteCrimeCost: "£1 billion",
} as const;

/** Derives a milestone's state from a moment. Mirrored in dwts-timeline.ts. */
export function milestoneStatus(
  milestones: DwtsMilestone[],
  index: number,
  now: number,
): MilestoneStatus {
  const time = new Date(milestones[index]!.iso).getTime();
  if (time <= now) return "done";
  const previous = milestones[index - 1];
  // The first milestone still ahead of us is the one being counted down to.
  if (!previous || new Date(previous.iso).getTime() <= now) return "current";
  return "future";
}

/** The next milestone still ahead of `now`, or null once they have all passed. */
export function nextMilestone(
  milestones: DwtsMilestone[],
  now: number,
): DwtsMilestone | null {
  return milestones.find((m) => new Date(m.iso).getTime() > now) ?? null;
}

/**
 * How far the present sits between two milestones, 0–1. Drives the partially
 * filled rail segment and the position of the "you are here" marker.
 */
export function segmentProgress(
  from: DwtsMilestone,
  to: DwtsMilestone,
  now: number,
): number {
  const start = new Date(from.iso).getTime();
  const end = new Date(to.iso).getTime();
  if (!(end > start)) return 0;
  return Math.min(1, Math.max(0, (now - start) / (end - start)));
}

/** DWTS-specific questions. Rendered on the guide and emitted as FAQPage. */
export interface DwtsFaqItem {
  question: string;
  answer: string;
}

export const dwtsFaqItems: DwtsFaqItem[] = [
  {
    question: "What is the Digital Waste Tracking Service?",
    answer:
      "It is the UK government service that replaces paper waste paperwork with a single digital record of where waste goes. Every load is recorded against a unique Waste Tracking ID, so a movement can be followed from the site that produced it to the site that finally treated it. It is run by Defra on behalf of all four UK nations and is enforced by the Environment Agency, SEPA, Natural Resources Wales and DAERA.",
  },
  {
    question: "When does digital waste tracking become mandatory?",
    answer:
      "In two phases. Phase 1 covers permitted and licensed sites that receive waste, and is mandatory from 1 October 2026 in England and Wales and from 1 January 2027 in Scotland and Northern Ireland. Phase 2 covers waste carriers, brokers, dealers, exempt waste operations and exporters, and is mandatory from October 2027 across the UK.",
  },
  {
    question: "Does digital waste tracking apply to skip hire firms?",
    answer:
      "Almost always, but usually in Phase 2 rather than Phase 1. A skip-hire firm that only collects and carries waste falls under the October 2027 carrier mandate. A firm that also runs a permitted transfer station or tip is a receiving site as well, so it is caught by Phase 1 in October 2026 in England and Wales, or January 2027 in Scotland and Northern Ireland.",
  },
  {
    question: "How long do I have to file a waste record?",
    answer:
      "The record must be complete by the end of the second working day after the day the waste was received. Waste received on a Monday morning must be filed before midnight on Wednesday. Weekends do not count. The duty is only discharged when the service returns a Waste Tracking ID — an attempted or rejected upload does not count as compliance.",
  },
  {
    question: "How much does digital waste tracking cost?",
    answer:
      "Defra charges £26 a year per legal entity that creates or edits records. It is not charged per movement, per user, or per site, and it is payable on first use and then on each anniversary once the service is mandatory. Waste disposal authorities receiving household waste from domestic property, and people who are digitally excluded, are exempt from registering and from the fee.",
  },
  {
    question: "What are the penalties for not tracking waste digitally?",
    answer:
      "In England the regulations set a fixed monetary penalty of £1,000, most likely for missing the two-working-day deadline, alongside variable monetary penalties with no upper limit, recovery of the regulator's investigation and legal costs, compliance notices and criminal prosecution. Scotland has its own civil penalty regime under SSI 2026/145, enforced by SEPA. The £5,000 per incident figure circulating in trade coverage does not appear in the England regulations.",
  },
  {
    question: "Do waste transfer notes still apply?",
    answer:
      "Yes, for now. Paper waste transfer notes and hazardous waste consignment notes remain legally required alongside digital tracking in Phase 1 — the digital record is an additional duty, not yet a replacement. Over time the service is intended to replace transfer notes, consignment notes, season tickets and Annex VII forms, and the Duty of Care Code of Practice will be revised and consulted on before that happens.",
  },
  {
    question: "Do I need software, or can I use a spreadsheet?",
    answer:
      "There are three routes. You can key each load into Defra's own web service, upload a spreadsheet using the temporary bulk route that is expected to remain until at least October 2027, or connect software that files automatically through Defra's API. Sites receiving more than a handful of loads a day generally find manual entry unsustainable, because every load has to be filed within two working days.",
  },
  {
    question: "Is Fleetlix approved by Defra for digital waste tracking?",
    answer:
      "Fleetlix has built the Phase 1 Receipt of Waste integration and proven it end to end against Defra's test environment, passing 13 of Defra's 14 production approval scenarios. The fourteenth is an open query with Defra about its own test service. We are waiting on Defra to issue production credentials, at which point we expect to appear on the GOV.UK list of approved software providers. We would rather tell you exactly where we are than display a badge we have not earned.",
  },
  {
    question: "What do I need before software can file on my behalf?",
    answer:
      "You need to register your own organisation for Report receipt of waste on GOV.UK and pay the £26 fee — a software provider cannot register or pay on your behalf. Registering gives you an API code for each permitted receiving site, which you then give to your software. You will also need your permit or licence number, and your carriers' registration numbers.",
  },
];
