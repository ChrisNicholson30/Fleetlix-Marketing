// Makes the DWTS timeline live.
//
// The component already renders a correct timeline at build time, so this
// script is an enhancement, not a dependency — with JavaScript off the page
// still shows the right phase, the right statuses and a frozen countdown.
//
// What "live" buys is truth after the fact. The marketing site can sit
// undeployed for months; a mandate date passing in the meantime would leave a
// build-time timeline quietly lying about which phase is in force. So the
// statuses, the rail fill and the countdown target are all recomputed here
// from the dates in the DOM, against the reader's clock, on every page load.
//
// Imported by DwtsTimeline.astro, so it loads on the homepage and on
// /digital-waste-tracking. Pulling in ./lib/motion (a shared chunk) is what
// keeps it an external /_astro/*.js file under `script-src 'self'` rather than
// an inline script whose CSP hash could drift. See src/scripts/lib/env.ts.

import { STATUS_LABEL } from "../config/dwts";
import { initReveals, initScrollProgress } from "./lib/motion";

initReveals();
initScrollProgress();

const roots = Array.from(document.querySelectorAll<HTMLElement>("[data-dwts]"));

for (const root of roots) {
  const items = Array.from(
    root.querySelectorAll<HTMLElement>("[data-milestone]"),
  );
  if (!items.length) continue;

  const times = items.map((el) => new Date(el.dataset.iso ?? "").getTime());
  if (times.some((t) => Number.isNaN(t))) continue;

  const track = root.querySelector<HTMLElement>("[data-dwts-track]");
  const countdown = root.querySelector<HTMLElement>("[data-dwts-countdown]");
  const cd = {
    title: countdown?.querySelector<HTMLElement>("[data-cd-title]") ?? null,
    date: countdown?.querySelector<HTMLElement>("[data-cd-date]") ?? null,
    tiles: countdown?.querySelector<HTMLElement>("[data-cd-tiles]") ?? null,
    complete:
      countdown?.querySelector<HTMLElement>("[data-cd-complete]") ?? null,
    days: countdown?.querySelector<HTMLElement>("[data-cd-days]") ?? null,
    hours: countdown?.querySelector<HTMLElement>("[data-cd-hours]") ?? null,
    mins: countdown?.querySelector<HTMLElement>("[data-cd-mins]") ?? null,
    secs: countdown?.querySelector<HTMLElement>("[data-cd-secs]") ?? null,
  };
  const pad = (n: number) => String(n).padStart(2, "0");

  // Fills from zero on reveal instead of rendering pre-filled. Set from JS so
  // that a visitor without it keeps the static, already-correct rail.
  track?.classList.add("dwts-animate");

  /** Index of the first milestone still ahead of `now`, or -1 once all pass. */
  const nextIndex = (now: number) => times.findIndex((t) => t > now);

  const paint = (now: number) => {
    const next = nextIndex(now);

    items.forEach((item, i) => {
      const status =
        times[i]! <= now ? "done" : i === next ? "current" : "future";
      item.dataset.status = status;
      const label = item.querySelector<HTMLElement>("[data-status-label]");
      if (label) label.textContent = STATUS_LABEL[status];

      // The connector running from this node to the next one. Full once the
      // next milestone has passed, empty until this one has, and part-filled
      // in between — which is the segment the "you are here" marker rides.
      const segment = item.querySelector<HTMLElement>("[data-seg]");
      if (!segment) return;
      const from = times[i]!;
      const to = times[i + 1];
      let fill = 0;
      if (to !== undefined && to <= now) fill = 1;
      else if (from <= now && to !== undefined && to > from) {
        fill = Math.min(1, Math.max(0, (now - from) / (to - from)));
      }
      segment.style.setProperty("--seg", fill.toFixed(4));
      segment.toggleAttribute("data-seg-active", fill > 0 && fill < 1);
    });

    return next;
  };

  const tick = () => {
    const now = Date.now();
    const next = paint(now);

    if (!countdown) return;

    if (next === -1) {
      // Every published milestone is in force. Swap the tiles for a plain
      // statement rather than counting down to a date in the past.
      cd.tiles?.setAttribute("hidden", "");
      cd.complete?.removeAttribute("hidden");
      if (cd.title) cd.title.textContent = "Every published phase is in force";
      if (cd.date) cd.date.textContent = "";
      return;
    }

    const target = items[next]!;
    cd.complete?.setAttribute("hidden", "");
    cd.tiles?.removeAttribute("hidden");
    if (cd.title) cd.title.textContent = target.dataset.title ?? "";
    if (cd.date) cd.date.textContent = target.dataset.dateLabel ?? "";

    const totalSecs = Math.max(0, Math.floor((times[next]! - Date.now()) / 1000));
    if (cd.days) cd.days.textContent = String(Math.floor(totalSecs / 86400));
    if (cd.hours) cd.hours.textContent = pad(Math.floor((totalSecs % 86400) / 3600));
    if (cd.mins) cd.mins.textContent = pad(Math.floor((totalSecs % 3600) / 60));
    if (cd.secs) cd.secs.textContent = pad(totalSecs % 60);
  };

  tick();
  setInterval(tick, 1000);
}
