// Tiny DOM/environment helpers shared by the page's client scripts
// (cinematic.ts, header-menu.ts). Its real purpose is twofold: remove the
// duplicated matchMedia/query boilerplate, AND — because it's imported by more
// than one hoisted <script> — make Rollup code-split it into a shared chunk.
// That forces those scripts to be emitted as EXTERNAL /_astro/*.js files
// (covered by `script-src 'self'`) instead of being inlined and hashed in the
// CSP. Inline-script hashes drift silently when the build minifier changes;
// external 'self' scripts never do. Don't collapse this back into the callers.

export const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const finePointer = (): boolean =>
  window.matchMedia("(pointer: fine)").matches;

export const qs = <T extends Element>(
  selector: string,
  root: ParentNode = document,
): T | null => root.querySelector<T>(selector);
