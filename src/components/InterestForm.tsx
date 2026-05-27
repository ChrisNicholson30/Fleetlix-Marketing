/** @jsxImportSource react */
import { useEffect, useId, useRef, useState } from "react";

const FLEET_SIZES = ["1-5", "6-20", "21-80", "81+", "Not sure"] as const;
const ROLES = [
  "Owner / Operator",
  "Office / Dispatch",
  "Driver",
  "Maintenance",
  "Other",
] as const;

type FieldErrors = Partial<Record<keyof FormState | "_", string>>;

type FormState = {
  name: string;
  email: string;
  company: string;
  fleet_size: (typeof FLEET_SIZES)[number] | "";
  role: (typeof ROLES)[number] | "";
  message: string;
  consent: boolean;
};

const CONTACT_EMAIL = "contact@fleetlix.com";

function buildMailto(state: FormState): string {
  const subject = `Register interest · ${state.name}${state.company ? ` · ${state.company}` : ""}`;
  const lines = [
    `Name: ${state.name}`,
    `Email: ${state.email}`,
    state.company ? `Company: ${state.company}` : null,
    state.fleet_size ? `Fleet size: ${state.fleet_size}` : null,
    state.role ? `Role: ${state.role}` : null,
    state.message ? `\nMessage:\n${state.message}` : null,
    "",
    "— Sent from the Register interest form on fleetlix.com",
  ].filter((line): line is string => line !== null);
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

const EMPTY: FormState = {
  name: "",
  email: "",
  company: "",
  fleet_size: "",
  role: "",
  message: "",
  consent: false,
};

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.12 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  );

function validateClient(state: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (state.name.trim().length < 2) errors.name = "Tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim()))
    errors.email = "Enter a valid email.";
  if (!state.consent) errors.consent = "We need your consent to email you back.";
  return errors;
}

export default function InterestForm() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const focusTimer = window.setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 60);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  function reset() {
    setState(EMPTY);
    setErrors({});
    setStatus("idle");
  }

  function close() {
    setOpen(false);
    window.setTimeout(reset, 220);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed: FormState = {
      ...state,
      name: state.name.trim(),
      email: state.email.trim(),
      company: state.company.trim(),
      message: state.message.trim(),
    };
    const clientErrors = validateClient(trimmed);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    window.location.href = buildMailto(trimmed);
    setStatus("success");
  }

  const fieldBase =
    "w-full rounded-lg bg-white/[0.04] border border-white/10 px-3.5 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[color:var(--color-amber)] focus:bg-white/[0.06] transition";
  const labelBase = "block text-xs font-semibold tracking-[0.14em] uppercase text-white/60";
  const errorText = "mt-1.5 text-xs text-[color:var(--color-error)]";

  return (
    <>
      <section id="register-interest" className="relative overflow-hidden bg-[color:var(--color-graphite)] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen"
          style={{ backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: "160px 160px" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[color:var(--color-amber)]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[color:var(--color-cyan)]/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--color-amber)]">
              Pre-launch
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] font-extrabold text-3xl md:text-5xl tracking-tight text-white">
              Be first in line when Fleetlix opens.
            </h2>
            <p className="mt-4 text-white/75 text-lg">
              The platform is being built right now in Central Scotland. We're inviting
              the first five operators in for pilot pricing — introductory rates in
              exchange for case-study rights. Leave your details and we'll be in touch
              the moment there's something real to show you.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-amber)] px-6 py-3 text-base font-semibold text-[color:var(--color-graphite)] shadow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-amber)] transition"
                style={{ transitionTimingFunction: EASING }}
              >
                Register your interest
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m13 5 7 7-7 7" />
                </svg>
              </button>
              <span className="text-sm text-white/55">
                No obligation · One email when we launch · UK GDPR
              </span>
            </div>
          </div>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
        >
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm motion-safe:animate-[fade-in_180ms_ease-out]"
          />

          <div
            ref={dialogRef}
            className="relative w-full sm:max-w-lg sm:mx-6 max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0c0a08] border border-white/10 text-white shadow-2xl motion-safe:animate-[modal-in_240ms_var(--ease-fleetlix)]"
            style={{ ["--ease-fleetlix" as string]: EASING } as React.CSSProperties}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-t-2xl sm:rounded-2xl opacity-[0.07] mix-blend-screen"
              style={{ backgroundImage: `url("${GRAIN_SVG}")`, backgroundSize: "160px 160px" }}
            />

            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[color:var(--color-amber)]">
                    Register your interest
                  </p>
                  <h3
                    id={headingId}
                    className="mt-2 font-[family-name:var(--font-display)] font-extrabold text-2xl tracking-tight text-white"
                  >
                    {status === "success" ? "Your email is ready to send." : "Tell us about your operation."}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="shrink-0 rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40 transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {status === "success" ? (
                <div className="mt-6">
                  <div className="rounded-xl border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10 p-4 space-y-3 text-sm text-emerald-200">
                    <p>
                      Your mail app should have opened with everything pre-filled.
                      Just hit <span className="font-semibold text-white">Send</span>{" "}
                      and we'll get it at{" "}
                      <span className="font-semibold text-white">{CONTACT_EMAIL}</span>.
                    </p>
                    <p className="text-emerald-200/80">
                      Nothing happened? Email us directly at{" "}
                      <a
                        href={buildMailto(state)}
                        className="font-semibold text-white underline underline-offset-2 hover:text-white"
                      >
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-6 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
                    style={{ transitionTimingFunction: EASING }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="if-name" className={labelBase}>Name</label>
                    <input
                      ref={firstFieldRef}
                      id="if-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={state.name}
                      onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                      className={`${fieldBase} mt-1.5`}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "if-name-err" : undefined}
                    />
                    {errors.name && <p id="if-name-err" className={errorText}>{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="if-email" className={labelBase}>Email</label>
                    <input
                      id="if-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={state.email}
                      onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                      className={`${fieldBase} mt-1.5`}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "if-email-err" : undefined}
                    />
                    {errors.email && <p id="if-email-err" className={errorText}>{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="if-company" className={labelBase}>Company <span className="font-normal normal-case tracking-normal text-white/40">· optional</span></label>
                    <input
                      id="if-company"
                      type="text"
                      autoComplete="organization"
                      value={state.company}
                      onChange={(e) => setState((s) => ({ ...s, company: e.target.value }))}
                      className={`${fieldBase} mt-1.5`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="if-fleet" className={labelBase}>Fleet size</label>
                      <select
                        id="if-fleet"
                        value={state.fleet_size}
                        onChange={(e) =>
                          setState((s) => ({
                            ...s,
                            fleet_size: e.target.value as FormState["fleet_size"],
                          }))
                        }
                        className={`${fieldBase} mt-1.5 appearance-none bg-[length:14px_14px] bg-[right_0.85rem_center] bg-no-repeat pr-9`}
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ffffff88' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                        }}
                      >
                        <option value="" className="bg-[#0c0a08]">Select…</option>
                        {FLEET_SIZES.map((size) => (
                          <option key={size} value={size} className="bg-[#0c0a08]">{size} vehicles</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="if-role" className={labelBase}>Your role</label>
                      <select
                        id="if-role"
                        value={state.role}
                        onChange={(e) =>
                          setState((s) => ({ ...s, role: e.target.value as FormState["role"] }))
                        }
                        className={`${fieldBase} mt-1.5 appearance-none bg-[length:14px_14px] bg-[right_0.85rem_center] bg-no-repeat pr-9`}
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ffffff88' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                        }}
                      >
                        <option value="" className="bg-[#0c0a08]">Select…</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="bg-[#0c0a08]">{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="if-message" className={labelBase}>Anything you want us to know <span className="font-normal normal-case tracking-normal text-white/40">· optional</span></label>
                    <textarea
                      id="if-message"
                      rows={3}
                      maxLength={1000}
                      value={state.message}
                      onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
                      className={`${fieldBase} mt-1.5 resize-none`}
                      placeholder="What software (or paper) are you running today?"
                    />
                  </div>

                  <label className="flex gap-3 items-start text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={state.consent}
                      onChange={(e) => setState((s) => ({ ...s, consent: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 accent-[color:var(--color-amber)]"
                      aria-invalid={!!errors.consent}
                      aria-describedby={errors.consent ? "if-consent-err" : undefined}
                    />
                    <span>
                      I'm happy for Fleetlix to email me about the launch and pilot programme.
                      No marketing lists, no third parties.
                    </span>
                  </label>
                  {errors.consent && <p id="if-consent-err" className={errorText}>{errors.consent}</p>}

                  <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition"
                      style={{ transitionTimingFunction: EASING }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-amber)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-graphite)] shadow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-amber)] transition"
                      style={{ transitionTimingFunction: EASING }}
                    >
                      Open in mail app
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
            @keyframes modal-in {
              from { opacity: 0; transform: translateY(16px) scale(0.985) }
              to   { opacity: 1; transform: translateY(0) scale(1) }
            }
            @media (prefers-reduced-motion: reduce) {
              .motion-safe\\:animate-\\[fade-in_180ms_ease-out\\],
              .motion-safe\\:animate-\\[modal-in_240ms_var\\(--ease-fleetlix\\)\\],
              .motion-safe\\:animate-spin {
                animation: none !important;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
