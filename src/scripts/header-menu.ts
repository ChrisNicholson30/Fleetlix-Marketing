// Close the mobile nav <details> on (a) anchor-link tap and (b) outside click.
// Without this, the menu would stay open after navigation, overlapping the
// section the user just scrolled to.
//
// Lives in its own module (imported by Header.astro's <script>) and pulls `qs`
// from ./lib/env so the built script is emitted as an EXTERNAL /_astro/*.js
// file under `script-src 'self'` — not an inline <script> whose CSP hash would
// drift when the minifier changes. See src/scripts/lib/env.ts.
import { qs } from "./lib/env";

document.addEventListener("click", (event) => {
  const target = event.target as Element | null;
  if (!target) return;
  const menu = qs<HTMLDetailsElement>("details.mobile-menu[open]");
  if (!menu) return;
  if (target.closest("a[href]")) {
    menu.open = false;
  } else if (!menu.contains(target)) {
    menu.open = false;
  }
});
