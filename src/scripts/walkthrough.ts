// Walkthrough player — the click-to-load facade.
//
// The page ships ZERO video weight. No iframe, no player JS, no request to
// Cloudflare Stream until the visitor presses play or picks a chapter. That is
// a performance decision and a privacy one at the same time:
//
//   - Performance: the Stream player is a few hundred KB of third-party JS
//     inside the iframe. Loading it on page view would cost every visitor who
//     never watches, and the poster is a code-drawn SVG, so the facade itself
//     is free.
//   - Privacy: this site sets no cookies and makes no third-party requests
//     (see /cookies). A click-to-load embed keeps that true by default — the
//     ONLY way any data reaches Cloudflare Stream is a deliberate press of a
//     play button. That affirmative action is what makes the embed lawful under
//     PECR without a consent banner, so DON'T "improve" this by preloading the
//     iframe, prefetching the origin, or firing it on scroll/hover. Doing so
//     silently converts this into non-consensual third-party storage and makes
//     the cookie policy wrong.
//
// Imports the shared env helpers so Rollup code-splits this into an external
// /_astro/*.js chunk under `script-src 'self'` rather than an inline hashed
// script. See src/scripts/lib/env.ts — inline hashes drift when the build
// minifier changes; this one can't.

import { qs, qsa } from "./lib/env";

const root = qs<HTMLElement>("[data-player]");

if (root) {
  const origin = root.dataset.origin ?? "";
  const uid = root.dataset.uid ?? "";

  // Belt and braces: the page already withholds the play button and the chapter
  // buttons when the video isn't configured, so this should never be the reason
  // nothing happens. It stops a half-set pair of env vars from building a
  // request to `https:///iframe`.
  if (origin && uid) {
    let frame: HTMLIFrameElement | null = null;

    /**
     * Swap the facade for the real player, optionally seeking. Called again for
     * every subsequent chapter click, which is why the iframe is reused: setting
     * .src re-seeks without tearing down and re-downloading the player.
     */
    const load = (startTime = 0): void => {
      const src =
        `${origin}/${uid}/iframe` +
        `?preload=none&letterboxColor=transparent&defaultTextTrack=en&autoplay=true` +
        (startTime ? `&startTime=${startTime}s` : "");

      if (frame) {
        frame.src = src;
        frame.contentWindow?.focus();
        return;
      }

      frame = document.createElement("iframe");
      frame.src = src;
      frame.title = "Fleetlix walkthrough";
      frame.loading = "lazy";
      frame.allow =
        "accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.className = "wt-frame";
      // replaceChildren, not appendChild: the facade button must leave the
      // accessibility tree entirely, or a screen reader still offers "Play the
      // Fleetlix walkthrough" on top of a player that is already playing.
      root.replaceChildren(frame);
    };

    qs<HTMLButtonElement>("[data-play]", root)?.addEventListener("click", () =>
      load(0),
    );

    qsa<HTMLButtonElement>("[data-at]").forEach((btn) => {
      btn.addEventListener("click", () => {
        load(Number(btn.dataset.at));
        // Chapters sit below the player, so a click from halfway down the list
        // would otherwise start playback off-screen. `block: "nearest"` would be
        // gentler, but the sticky header overlaps the top of the frame — start
        // is the position that actually shows the whole 16:9 box.
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
}
