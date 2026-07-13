// Cinematic homepage behaviour. Imported from index.astro via a processed
// <script>. It imports ./lib/env, which makes Astro emit this as an EXTERNAL
// /_astro/*.js file (script-src 'self') instead of an inline hashed <script> —
// inline-script hashes drift silently when the build minifier changes, external
// 'self' scripts don't. Nearly all visual motion lives in CSS; this toggles
// reveal classes, drives the compliance countdown, and adds a handful of
// pointer/scroll enhancers (scroll-progress, active-nav, count-up, card
// spotlight) that are each fully optional and no-op when targets are absent.
import { prefersReducedMotion, finePointer as finePointerQuery } from "./lib/env";

const reduceMotion = prefersReducedMotion();
const finePointer = finePointerQuery();

// Scroll reveals — add `.is-visible` when an element enters the viewport.
const reveals = document.querySelectorAll<HTMLElement>("[data-reveal]");
if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
  );
  reveals.forEach((el) => io.observe(el));
}

// Compliance countdown — ticks the [data-cd-*] fields down to the target date
// in [data-countdown]. Lives in this homepage bundle (not its own island) so it
// costs no extra CSP hash; the element only exists on the homepage, so this
// no-ops elsewhere. Days run unpadded; hours/mins/secs pad to two digits.
const countdown = document.querySelector<HTMLElement>("[data-countdown]");
if (countdown) {
  const target = new Date(countdown.dataset.countdown ?? "").getTime();
  const daysEl = countdown.querySelector<HTMLElement>("[data-cd-days]");
  const hoursEl = countdown.querySelector<HTMLElement>("[data-cd-hours]");
  const minsEl = countdown.querySelector<HTMLElement>("[data-cd-mins]");
  const secsEl = countdown.querySelector<HTMLElement>("[data-cd-secs]");
  const pad = (n: number) => String(n).padStart(2, "0");
  const render = () => {
    const diff = Math.max(0, target - Date.now());
    const totalSecs = Math.floor(diff / 1000);
    if (daysEl) daysEl.textContent = String(Math.floor(totalSecs / 86400));
    if (hoursEl) hoursEl.textContent = pad(Math.floor((totalSecs % 86400) / 3600));
    if (minsEl) minsEl.textContent = pad(Math.floor((totalSecs % 3600) / 60));
    if (secsEl) secsEl.textContent = pad(totalSecs % 60);
    return diff;
  };
  if (!Number.isNaN(target) && render() > 0) {
    const id = setInterval(() => {
      if (render() <= 0) clearInterval(id);
    }, 1000);
  }
}

// Header scroll-progress bar — sets --scroll (0–1) on [data-scroll-progress].
// rAF-throttled so it never blocks the scroll thread. Runs regardless of
// motion preference (it mirrors position, it isn't decorative animation).
const progressBar = document.querySelector<HTMLElement>("[data-scroll-progress]");
if (progressBar) {
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    progressBar.style.setProperty("--scroll", ratio.toFixed(4));
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

// Active-section nav highlighting — marks the [data-nav-link] whose target
// section is crossing the viewport middle. A zero-height band at 50% means
// (at most) one section qualifies at a time, so exactly one link lights up.
const navLinks = Array.from(
  document.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"),
);
if (navLinks.length && "IntersectionObserver" in window) {
  const linksById = new Map<string, HTMLAnchorElement[]>();
  for (const link of navLinks) {
    const id = link.getAttribute("href")?.replace(/^#/, "") ?? "";
    if (!id) continue;
    const arr = linksById.get(id) ?? [];
    arr.push(link);
    linksById.set(id, arr);
  }
  const setActive = (id: string | null) => {
    for (const [sectionId, links] of linksById) {
      const on = sectionId === id;
      links.forEach((l) => l.classList.toggle("is-active", on));
    }
  };
  const navObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
  );
  for (const id of linksById.keys()) {
    const section = document.getElementById(id);
    if (section) navObserver.observe(section);
  }
}

// Count-up numbers — animate [data-count] from 0 to its target the first time
// it scrolls into view. Honours prefixes/suffixes/decimals and en-GB grouping.
// Reduced motion (or no IO) jumps straight to the final value.
const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
if (counters.length) {
  const format = (el: HTMLElement, value: number) => {
    const decimals = Number(el.dataset.countDecimals ?? "0");
    const body = value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    el.textContent = `${el.dataset.countPrefix ?? ""}${body}${el.dataset.countSuffix ?? ""}`;
  };
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count ?? "0");
    if (reduceMotion) {
      format(el, target);
      return;
    }
    const duration = Number(el.dataset.countDuration ?? "1600");
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      format(el, target * eased);
      if (t < 1) requestAnimationFrame(tick);
      else format(el, target);
    };
    requestAnimationFrame(tick);
  };
  if (reduceMotion || !("IntersectionObserver" in window)) {
    counters.forEach((el) => run(el));
  } else {
    const countObserver = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run(entry.target as HTMLElement);
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    counters.forEach((el) => countObserver.observe(el));
  }
}

// Card cursor-spotlight — writes --mx/--my (percent) as the pointer moves over
// a [data-spotlight] card, so the CSS radial glow follows the cursor. Desktop
// fine-pointer only; touch devices get the static resting glow.
if (finePointer) {
  const spotlights = document.querySelectorAll<HTMLElement>("[data-spotlight]");
  for (const card of spotlights) {
    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--mx", `${x}%`);
        card.style.setProperty("--my", `${y}%`);
      },
      { passive: true },
    );
  }
}
