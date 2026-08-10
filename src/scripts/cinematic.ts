// Cinematic homepage behaviour. Imported from index.astro via a processed
// <script>. It imports ./lib/motion (which imports ./lib/env), so Astro emits
// this as an EXTERNAL /_astro/*.js file (script-src 'self') instead of an
// inline hashed <script> — inline-script hashes drift silently when the build
// minifier changes, external 'self' scripts don't.
//
// Nearly all visual motion lives in CSS; these initialisers only toggle
// classes and write custom properties. Each is a no-op when its targets are
// absent, and each is idempotent, so DwtsTimeline.astro's own script calling
// initReveals() as well costs nothing.
//
// The compliance countdown used to live here. It moved to
// src/scripts/dwts-timeline.ts, which travels with the component that renders
// it and therefore works on /digital-waste-tracking too.
import {
  initReveals,
  initScrollProgress,
  initActiveNav,
  initCountUp,
  initSpotlight,
} from "./lib/motion";

initReveals();
initScrollProgress();
initActiveNav();
initCountUp();
initSpotlight();
