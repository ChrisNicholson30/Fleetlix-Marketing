// Page motion behaviours, each one optional and each one a no-op when its
// target elements are absent.
//
// These used to live inline in cinematic.ts, which only the homepage loads.
// The DWTS timeline appears on the homepage AND on /digital-waste-tracking, so
// the behaviours it depends on (scroll reveals above all — `[data-reveal]`
// elements start at opacity 0 at md and up and stay invisible until something
// adds `.is-visible`) had to become shareable rather than be duplicated.
//
// Every initialiser is idempotent: the modules are singletons, so a page that
// calls the same initialiser from two entry scripts still only wires it once.
// Importing this module is also what keeps its callers OUT of the CSP hash
// list — a shared chunk forces Rollup to emit them as external /_astro/*.js
// files under `script-src 'self'`. See src/scripts/lib/env.ts.

import { prefersReducedMotion, finePointer, qsa } from "./env";

const done = new Set<string>();
const once = (key: string): boolean => {
  if (done.has(key)) return false;
  done.add(key);
  return true;
};

/** Adds `.is-visible` to every `[data-reveal]` as it enters the viewport. */
export function initReveals(): void {
  if (!once("reveals")) return;
  const reveals = qsa<HTMLElement>("[data-reveal]");
  if (!reveals.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
    return;
  }
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

/**
 * Sets --scroll (0–1) on [data-scroll-progress] — the hairline reading bar in
 * the header. rAF-throttled so it never blocks the scroll thread, and it runs
 * regardless of motion preference: it mirrors position, it isn't decoration.
 */
export function initScrollProgress(): void {
  if (!once("scroll-progress")) return;
  const bar = document.querySelector<HTMLElement>("[data-scroll-progress]");
  if (!bar) return;

  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.setProperty("--scroll", ratio.toFixed(4));
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

/**
 * Marks the [data-nav-link] whose target section is crossing the viewport
 * middle. A zero-height band at 50% means at most one section qualifies at a
 * time, so exactly one link lights up.
 */
export function initActiveNav(): void {
  if (!once("active-nav")) return;
  const navLinks = qsa<HTMLAnchorElement>("[data-nav-link]");
  if (!navLinks.length || !("IntersectionObserver" in window)) return;

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
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(entry.target.id);
      }
    },
    { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
  );
  for (const id of linksById.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

/**
 * Animates [data-count] from 0 to its target the first time it scrolls into
 * view, honouring prefixes, suffixes, decimals and en-GB grouping. Reduced
 * motion (or no IntersectionObserver) jumps straight to the final value.
 */
export function initCountUp(): void {
  if (!once("count-up")) return;
  const counters = qsa<HTMLElement>("[data-count]");
  if (!counters.length) return;

  const reduceMotion = prefersReducedMotion();
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
    counters.forEach(run);
    return;
  }
  const observer = new IntersectionObserver(
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
  counters.forEach((el) => observer.observe(el));
}

/**
 * Writes --mx/--my (percent) as the pointer moves over a [data-spotlight] card
 * so the CSS radial glow follows the cursor. Fine-pointer only; touch devices
 * keep the static resting glow.
 */
export function initSpotlight(): void {
  if (!once("spotlight")) return;
  if (!finePointer()) return;

  for (const card of qsa<HTMLElement>("[data-spotlight]")) {
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
