// /security — two small jobs, both optional.
//
// Imports a shared module (lib/motion.ts, which imports lib/env.ts) so Rollup
// code-splits this into an external /_astro/*.js chunk covered by
// `script-src 'self'`. Don't collapse the import away — an inline script here
// would need a CSP hash, and hashes drift when the build minifier changes.
//
// Everything below is enhancement only. With JavaScript off the contents rail
// is still a working list of anchors, and the Save-as-PDF button is inert
// rather than broken (the reader's own print command does the same thing).
import { qs } from "./lib/env";
import { initActiveNav } from "./lib/motion";

// Lights up the contents rail entry for whichever section is mid-viewport.
// Reused from the homepage: the rail's links carry [data-nav-link] and point
// at ids that exist on this page, which is all initActiveNav needs.
initActiveNav();

// The page replaced a PDF, so the reader who still wants a file gets a button
// instead of being told to press Ctrl+P. Print styling lives in global.css.
qs<HTMLButtonElement>("[data-print]")?.addEventListener("click", () => {
  window.print();
});
