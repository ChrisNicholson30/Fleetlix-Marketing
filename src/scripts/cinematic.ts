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
