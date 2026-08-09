// Single source of truth for the homepage FAQ.
//
// Consumed twice:
//   1. src/components/Faq.astro renders the visible <details> accordion.
//   2. src/pages/index.astro emits the FAQPage JSON-LD from the same array.
//
// Google requires FAQ rich-result content to be VISIBLE on the page and to
// match the structured data. Keeping one array feeds both, so the schema can
// never drift from what the visitor reads. Answers are plain text — no markup —
// so they serialise cleanly into the JSON-LD `acceptedAnswer.text`.

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "What is Fleetlix?",
    answer:
      "Fleetlix is UK-built operations software for waste, skip-hire, and haulage firms. It replaces spreadsheets, paper tickets, and expensive legacy systems with one Progressive Web App covering driver, yard, office, and maintenance workflows.",
  },
  {
    question: "Who is Fleetlix for?",
    answer:
      "Small-to-medium skip-hire operators, waste collectors, and hauliers — typically running 1 to 80 vehicles. It is built for the underserved 90% of UK operators currently on paper, spreadsheets, or basic ticketing software.",
  },
  {
    question: "How much does Fleetlix cost?",
    answer:
      "Five plans, from £99 to £949 per month plus VAT: Operator, Workshop, Depot, Haulier, and Network. Paying annually costs ten months rather than twelve, so two months are free. Every plan runs the full operations platform — tiers differ by team size and which commercial modules are unlocked. That sits well below the enterprise software vendors serving the sector, and a clear step up from the spreadsheet-and-paper status quo.",
  },
  {
    question: "Do the prices include VAT?",
    answer:
      "No. Every price shown on the site excludes VAT. FLEETLIX LTD is VAT registered, so a UK business pays the listed price plus VAT at 20%, which most can then reclaim on their own return. VAT is worked out and added at checkout. A business outside the UK can enter its VAT number at checkout and is handled under the reverse charge.",
  },
  {
    question: "How are user seats counted?",
    answer:
      "Each plan includes a set number of driver, yard, mechanic, and office seats — the four roles the app actually assigns. Drivers is the headline number because it is the one a yard owner can answer without checking. Admin is a permission rather than a seat type, so an office or yard user can hold admin rights without using an extra login. Seat limits are enforced in the database, not just the interface.",
  },
  {
    question: "Does Fleetlix support haulage operators?",
    answer:
      "Fleetlix is launching for waste, skip-hire, and waste-carrier operators first — that is where the product is focused today. Dedicated haulage support is expected in May 2027. If you run a haulage fleet, register your interest now and we will let you know the moment it is ready.",
  },
  {
    question: "Do drivers need to install an app?",
    answer:
      "No. Fleetlix is a Progressive Web App, so drivers simply open a link — there is nothing to download from an app store and nothing for IT to provision. It works on any phone, tablet, or yard PC.",
  },
  {
    question: "Does Fleetlix handle DVSA walk-around checks?",
    answer:
      "Yes. Drivers complete DVSA-compliant walk-around checks in the cab, time-stamped and with photo and signature capture. A failed check becomes a work order in a tap and can flag a vehicle off-road automatically.",
  },
  {
    question: "Can Fleetlix produce Waste Transfer Notes?",
    answer:
      "Yes. Waste Transfer Notes and weighbridge tickets are generated automatically as PDFs from data already in the system — no re-typed fields, with an append-only audit trail for regulated workflows.",
  },
  {
    question: "Does Fleetlix work offline?",
    answer:
      "Yes. The driver app is offline-first: run sheets, checks, and proof of delivery work without a signal and sync back to the office the moment a connection returns.",
  },
  {
    question: "Where is Fleetlix based?",
    answer:
      "Fleetlix is built in Glasgow by FLEETLIX LTD and serves waste, skip-hire, and haulage operators across the United Kingdom.",
  },
];
