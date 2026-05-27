// Cinematic homepage behaviour. Imported from index.astro via a processed
// <script>, so Astro bundles it to an external module under /_astro — covered
// by `script-src 'self'` with no CSP hash to maintain. All visual motion lives
// in CSS; this only toggles classes and lazily attaches the hero loop.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// Hero aerial loop — attach only after the page is interactive, never under
// reduced motion. preload="none" keeps it off the critical path until then.
const video = document.querySelector<HTMLVideoElement>("[data-hero-video]");
if (video && !reduceMotion) {
  let started = false;
  const start = () => {
    if (started) return;
    const src = video.dataset.src;
    if (!src) return;
    started = true;
    video.src = src;
    video.load();
    video.addEventListener(
      "playing",
      () => video.classList.add("is-playing"),
      { once: true },
    );
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
  };
  const schedule = () => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(start, { timeout: 2500 });
    } else {
      setTimeout(start, 800);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}
