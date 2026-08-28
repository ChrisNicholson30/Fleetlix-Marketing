// Entry script for /terms-of-service.
//
// Imports a shared module (lib/motion, which imports lib/env), so Rollup
// code-splits it and Astro emits this as an external /_astro/*.js file under
// script-src 'self' — no CSP hash to drift. Don't inline it.
//
// Enhancement only: the contents rail is a working list of anchors with JS off.
import { initActiveNav } from "./lib/motion";

initActiveNav();
