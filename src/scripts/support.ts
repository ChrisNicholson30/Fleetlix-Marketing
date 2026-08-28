// Entry script for /support.
//
// Imports a shared module (lib/motion, which imports lib/env), so Rollup
// code-splits it and Astro emits this as an external /_astro/*.js file covered
// by script-src 'self' — no CSP hash to drift. Don't inline it. See the CSP
// section of CLAUDE.md for the outage that made this the rule.
//
// The page is server-rendered complete: the contents rail works with JS off,
// and this only adds the active-section highlight as the reader scrolls.
import { initActiveNav } from "./lib/motion";

initActiveNav();
