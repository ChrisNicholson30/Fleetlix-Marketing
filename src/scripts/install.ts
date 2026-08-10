// Install guide — pre-select the tab matching the device the visitor is holding.
//
// The tabs themselves are pure CSS (radios + :has() in global.css, the same
// mechanism as the pricing billing toggle), so every platform's instructions are
// in the DOM, crawlable, and switchable with JavaScript disabled. This script
// only moves the STARTING selection, which is the whole usability win: a driver
// sent this link on an iPhone should land on the Safari steps without first
// having to know they need the Safari steps.
//
// Progressive enhancement, strictly. If this never runs, the markup's default
// checked radio still gives a working guide.
//
// Imports the shared env helpers so Rollup emits this as an external
// /_astro/*.js chunk under `script-src 'self'` instead of an inline hashed
// script. See src/scripts/lib/env.ts.

import { qs } from "./lib/env";

/**
 * Which platform tab to open, or null to leave the markup default alone.
 *
 * User-agent sniffing is the wrong tool for feature decisions and the right one
 * here: the answer is literally "which set of OS instructions do you need", and
 * no feature detection can tell you whether the Share button is at the top or
 * the bottom of the screen. Nothing breaks when it guesses wrong — the visitor
 * taps a different tab.
 */
const detect = (): string | null => {
  const ua = navigator.userAgent;

  // iPad first, and not from the UA string. Since iPadOS 13 Safari reports
  // itself as "Macintosh", so a plain /iPad/ test sends every modern iPad to the
  // Mac tab and tells the user to open the File menu they don't have. A
  // touch-capable "Mac" is an iPad.
  const isTouchMac =
    /Macintosh/.test(ua) &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1;
  if (/iPad/.test(ua) || isTouchMac) return "ipad";

  if (/iPhone|iPod/.test(ua)) return "iphone";
  // Android before Windows/Mac: some Android WebViews carry "Linux" and other
  // desktop-looking tokens, but nothing else claims "Android".
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  if (/Macintosh|Mac OS X/.test(ua)) return "mac";

  return null;
};

const id = detect();

if (id) {
  const radio = qs<HTMLInputElement>(`#platform-${id}`);
  if (radio && !radio.checked) {
    radio.checked = true;
  }

  // Confirm the guess in the UI. Without this the tab silently changes under
  // someone who expected the first one, which reads as a bug; naming the device
  // turns it into an explanation and hints that the other tabs are still there.
  const hint = qs<HTMLElement>("[data-detected]");
  const label = qs<HTMLElement>(`[data-platform-label="${id}"]`);
  if (hint && label) {
    hint.textContent = `Showing ${label.textContent?.trim()} — pick another above if that's not your device.`;
    hint.hidden = false;
  }
}
