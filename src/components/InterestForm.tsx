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

const fieldBase =
  "w-full rounded-lg bg-white/[0.05] border border-white/15 px-3.5 py-2.5 text-white placeholder:text-white/55 focus:outline-none focus:border-[color:var(--color-amber)] focus:bg-white/[0.07] transition";
const labelBase = "block text-xs font-semibold tracking-[0.14em] uppercase text-white/75";
const errorText = "mt-1.5 text-xs text-[color:var(--color-error)]";

type FormBodyProps = {
  formId: string;
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  errors: FieldErrors;
  status: "idle" | "submitting" | "success" | "error";
  errorMessage: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  firstFieldRef?: React.RefObject<HTMLInputElement | null>;
};

function FormBody({
  formId,
  state,
  setState,
  errors,
  status,
  errorMessage,
  onSubmit,
  onCancel,
  cancelLabel = "Cancel",
  firstFieldRef,
}: FormBodyProps) {
  const submitting = status === "submitting";

  if (status === "success") {
    return (
      <div>
        <div className="rounded-xl border border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/10 p-4">
          <p className="text-sm text-emerald-100">
            Thanks — we've got your details. You'll hear from us at{" "}
            <span className="font-semibold text-white">{state.email}</span>{" "}
            the moment Fleetlix is ready to demo. We've also sent you a quick
            confirmation just so you know it landed.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
            style={{ transitionTimingFunction: EASING }}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" id={formId}>
      <div>
        <label htmlFor={`${formId}-name`} className={labelBase}>Name</label>
        <input
          ref={firstFieldRef}
          id={`${formId}-name`}
          type="text"
          autoComplete="name"
          required
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          className={`${fieldBase} mt-1.5`}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${formId}-name-err` : undefined}
        />
        {errors.name && <p id={`${formId}-name-err`} className={errorText}>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor={`${formId}-email`} className={labelBase}>Email</label>
        <input
          id={`${formId}-email`}
          type="email"
          autoComplete="email"
          required
          value={state.email}
          onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          className={`${fieldBase} mt-1.5`}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${formId}-email-err` : undefined}
        />
        {errors.email && <p id={`${formId}-email-err`} className={errorText}>{errors.email}</p>}
      </div>

      <div>
        <label htmlFor={`${formId}-company`} className={labelBase}>
          Company <span className="font-normal normal-case tracking-normal text-white/60">· optional</span>
        </label>
        <input
          id={`${formId}-company`}
          type="text"
          autoComplete="organization"
          value={state.company}
          onChange={(e) => setState((s) => ({ ...s, company: e.target.value }))}
          className={`${fieldBase} mt-1.5`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${formId}-fleet`} className={labelBase}>
            Fleet size <span className="ml-1 text-[10px] font-bold tracking-wider text-[color:var(--color-amber)]">MOST USEFUL</span>
          </label>
          <select
            id={`${formId}-fleet`}
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
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ffffffaa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
            }}
          >
            <option value="" className="bg-[#0c0a08]">Select…</option>
            {FLEET_SIZES.map((size) => (
              <option key={size} value={size} className="bg-[#0c0a08]">{size} vehicles</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${formId}-role`} className={labelBase}>Your role</label>
          <select
            id={`${formId}-role`}
            value={state.role}
            onChange={(e) =>
              setState((s) => ({ ...s, role: e.target.value as FormState["role"] }))
            }
            className={`${fieldBase} mt-1.5 appearance-none bg-[length:14px_14px] bg-[right_0.85rem_center] bg-no-repeat pr-9`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23ffffffaa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
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
        <label htmlFor={`${formId}-message`} className={labelBase}>
          Anything you want us to know <span className="font-normal normal-case tracking-normal text-white/60">· optional</span>
        </label>
        <textarea
          id={`${formId}-message`}
          rows={3}
          maxLength={1000}
          value={state.message}
          onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
          className={`${fieldBase} mt-1.5 resize-none`}
          placeholder="What software (or paper) are you running today?"
        />
      </div>

      <label className="flex gap-3 items-start text-sm text-white/80">
        <input
          type="checkbox"
          checked={state.consent}
          onChange={(e) => setState((s) => ({ ...s, consent: e.target.checked }))}
          className="mt-0.5 h-4 w-4 rounded border-white/40 bg-white/10 accent-[color:var(--color-amber)]"
          aria-invalid={!!errors.consent}
          aria-describedby={errors.consent ? `${formId}-consent-err` : undefined}
        />
        <span>
          I'm happy for Fleetlix to email me about the launch and pilot programme.
          No marketing lists, no third parties.
        </span>
      </label>
      {errors.consent && <p id={`${formId}-consent-err`} className={errorText}>{errors.consent}</p>}

      {status === "error" && errorMessage && (
        <div className="rounded-lg border border-[color:var(--color-error)]/40 bg-[color:var(--color-error)]/10 p-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition"
            style={{ transitionTimingFunction: EASING }}
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-amber)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-graphite)] shadow hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-amber)] transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ transitionTimingFunction: EASING }}
        >
          {submitting ? (
            <>
              <svg className="h-4 w-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Sending…
            </>
          ) : (
            "Register interest"
          )}
        </button>
      </div>
    </form>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function InterestForm() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inlineFirstFieldRef = useRef<HTMLInputElement | null>(null);
  const modalFirstFieldRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const headingId = useId();
  const inlineFormId = useId();
  const modalFormId = useId();

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    const focusTimer = window.setTimeout(() => {
      modalFirstFieldRef.current?.focus();
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
    setErrorMessage(null);
  }

  function closeModal() {
    setOpen(false);
    window.setTimeout(reset, 220);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clientErrors = validateClient(state);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/register-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: state.name.trim(),
          email: state.email.trim(),
          company: state.company.trim() || undefined,
          fleet_size: state.fleet_size || undefined,
          role: state.role || undefined,
          message: state.message.trim() || undefined,
          consent: state.consent,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          fieldErrors?: Record<string, string>;
        };
        if (data.fieldErrors) setErrors(data.fieldErrors as FieldErrors);
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Check your connection and retry.");
    }
  }

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
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--color-amber)]">
                Pre-launch
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] font-extrabold text-3xl md:text-5xl tracking-tight text-white">
                Be first in line when Fleetlix opens.
              </h2>
              <p className="mt-4 text-white/85 text-lg">
                The platform is being built right now in Central Scotland. We're inviting
                the first five operators in for pilot pricing — introductory rates in
                exchange for case-study rights. Leave your details and we'll be in touch
                the moment there's something real to show you.
              </p>

              {/* Modal trigger — shown wherever the inline form isn't (below lg). */}
              <div className="mt-8 lg:hidden flex flex-wrap items-center gap-4">
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
              </div>

              <p className="mt-6 text-sm text-white/75">
                No obligation · One email when we launch · UK GDPR
              </p>
            </div>

            {/* Desktop inline form (lg+) */}
            <div className="hidden lg:block lg:col-span-7">
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-7 lg:p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
                <FormBody
                  formId={inlineFormId}
                  state={state}
                  setState={setState}
                  errors={errors}
                  status={status}
                  errorMessage={errorMessage}
                  onSubmit={onSubmit}
                  firstFieldRef={inlineFirstFieldRef}
                  onCancel={status === "success" ? reset : undefined}
                  cancelLabel="Submit another"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile modal */}
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
            onClick={closeModal}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm motion-safe:animate-[fade-in_180ms_ease-out]"
          />

          <div
            ref={dialogRef}
            className="relative w-full sm:max-w-lg sm:mx-6 max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0c0a08] border border-white/10 text-white shadow-2xl motion-safe:animate-[modal-in_240ms_var(--ease-fleetlix)]"
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
                    {status === "success" ? "You're on the list." : "Tell us about your operation."}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="shrink-0 inline-flex items-center justify-center h-11 w-11 rounded-lg text-white/75 hover:text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/40 transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="mt-6">
                <FormBody
                  formId={modalFormId}
                  state={state}
                  setState={setState}
                  errors={errors}
                  status={status}
                  errorMessage={errorMessage}
                  onSubmit={onSubmit}
                  firstFieldRef={modalFirstFieldRef}
                  onCancel={closeModal}
                />
              </div>
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
