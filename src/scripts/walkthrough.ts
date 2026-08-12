// Walkthrough player — the click-to-load facade.
//
// The page ships ZERO video weight. No <video> element, no media request, until
// the visitor presses play or picks a chapter. The file is 54 MB; loading it on
// page view would be indefensible on a phone, and the poster is a still that
// Astro has already optimised, so the facade itself costs almost nothing.
//
// It is also what keeps the site's privacy position intact. Fetching the video
// reaches Supabase, whose CDN sets a `__cf_bm` bot-management cookie on
// supabase.co. Because nothing is requested until a deliberate press of a play
// button, that press IS the consent — which is what makes this lawful under
// PECR without a banner, and what /cookies §4 states in writing. So DON'T
// "improve" this by preloading the file, adding <link rel=preconnect>, or
// starting it on scroll or hover. Any of those makes the request happen without
// consent and turns the cookie policy into a false statement.
//
// A native <video> with a direct file URL — not an embed SDK — is the reason
// this is only a media request: no third-party script runs on the page at all.
//
// Imports the shared env helpers so Rollup code-splits this into an external
// /_astro/*.js chunk under `script-src 'self'` rather than an inline hashed
// script. See src/scripts/lib/env.ts.

import { qs, qsa } from "./lib/env";

const root = qs<HTMLElement>("[data-player]");

if (root) {
  const src = root.dataset.src ?? "";
  const poster = root.dataset.poster ?? "";

  if (src) {
    let video: HTMLVideoElement | null = null;

    /** play() rejects if the browser blocks playback; every call here follows a
     *  real click so it shouldn't, but an unhandled rejection in the console is
     *  noise that looks like a bug. */
    const play = (el: HTMLVideoElement): void => {
      void el.play().catch(() => {
        /* user can press the native control */
      });
    };

    /**
     * Swap the facade for a real player, optionally seeking. Called again for
     * every later chapter click — the element is reused, so seeking is a
     * range request rather than a fresh download of the whole file.
     */
    const load = (startTime = 0): void => {
      if (video) {
        // Metadata is long since loaded by this point, so a direct assignment
        // seeks immediately. Supabase Storage answers range requests (verified
        // 206 + accept-ranges), which is what makes mid-file seeking work at
        // all — without it the browser would refuse to jump ahead.
        video.currentTime = startTime;
        play(video);
        return;
      }

      video = document.createElement("video");
      video.src = src;
      if (poster) video.poster = poster;
      video.controls = true;
      video.playsInline = true;
      video.preload = "auto";
      video.className = "wt-frame";
      video.setAttribute("aria-label", "Fleetlix product walkthrough");

      if (startTime) {
        // currentTime can't be set before the browser knows the duration, so
        // the first seek has to wait for metadata. Later ones don't.
        video.addEventListener(
          "loadedmetadata",
          () => {
            if (video) video.currentTime = startTime;
          },
          { once: true },
        );
      }

      // replaceChildren, not appendChild: the facade button must leave the
      // accessibility tree entirely, or a screen reader still offers "Play the
      // Fleetlix walkthrough" on top of a player that is already playing.
      root.replaceChildren(video);
      play(video);
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
