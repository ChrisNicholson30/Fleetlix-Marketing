// /security — one small job, and it is enhancement only.
//
// Imports a shared module (lib/motion.ts, which imports lib/env.ts) so Rollup
// code-splits this into an external /_astro/*.js chunk covered by
// `script-src 'self'`. Don't collapse the import away — an inline script here
// would need a CSP hash, and hashes drift when the build minifier changes.
//
// With JavaScript off the contents rail is still a working list of anchors and
// the PDF still downloads — it is a plain <a download>, not a scripted one.
import { initActiveNav } from "./lib/motion";

// Lights up the contents rail entry for whichever section is mid-viewport.
// Reused from the homepage: the rail's links carry [data-nav-link] and point
// at ids that exist on this page, which is all initActiveNav needs.
initActiveNav();
