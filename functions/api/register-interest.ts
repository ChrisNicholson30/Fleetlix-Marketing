import { z } from "zod";

// Cloudflare Pages Function: POST /api/register-interest
//
// Validates the submission with zod, optionally verifies a Cloudflare
// Turnstile token (only if TURNSTILE_SECRET_KEY is configured), and
// emails the payload via Resend. Submissions are not persisted.

type Env = {
  RESEND_API_KEY?: string;
  INTEREST_TO_EMAIL?: string;
  INTEREST_FROM_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
};

type Ctx = { request: Request; env: Env };

const FLEET_SIZES = ["1-5", "6-20", "21-80", "81+", "Not sure"] as const;
const ROLES = [
  "Owner / Operator",
  "Office / Dispatch",
  "Driver",
  "Maintenance",
  "Other",
] as const;

const Payload = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(200),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  fleet_size: z.enum(FLEET_SIZES).optional(),
  role: z.enum(ROLES).optional(),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required" }),
  }),
  turnstile_token: z.string().optional(),
});

type ParsedPayload = z.infer<typeof Payload>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

async function verifyTurnstile(secret: string, token: string, ip: string | null) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

function renderEmail(
  payload: ParsedPayload,
  meta: { ip: string | null; userAgent: string | null; timestamp: string },
) {
  const submittedAt = new Date(meta.timestamp).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const firstName = payload.name.trim().split(/\s+/)[0] || payload.name;

  const textLines = [
    "FLEETLIX · New registration of interest",
    "",
    `Name:        ${payload.name}`,
    `Email:       ${payload.email}`,
    payload.company ? `Company:     ${payload.company}` : null,
    payload.fleet_size ? `Fleet size:  ${payload.fleet_size}` : null,
    payload.role ? `Role:        ${payload.role}` : null,
    payload.message ? `\nMessage:\n${payload.message}` : null,
    "",
    `Submitted:   ${submittedAt} (Europe/London)`,
    `IP:          ${meta.ip || "—"}`,
    `User agent:  ${meta.userAgent || "—"}`,
    "",
    `Reply to this email to respond to ${firstName} directly.`,
  ].filter((line): line is string => line !== null);
  const text = textLines.join("\n");

  const fields: Array<[string, string]> = [
    ["Name", escapeHtml(payload.name)],
    [
      "Email",
      `<a href="mailto:${escapeHtml(payload.email)}" style="color:#0098C7;text-decoration:none;">${escapeHtml(payload.email)}</a>`,
    ],
  ];
  if (payload.company) fields.push(["Company", escapeHtml(payload.company)]);
  if (payload.fleet_size) {
    const formatted = payload.fleet_size === "Not sure"
      ? payload.fleet_size
      : `${payload.fleet_size} vehicles`;
    fields.push(["Fleet size", escapeHtml(formatted)]);
  }
  if (payload.role) fields.push(["Role", escapeHtml(payload.role)]);

  const fieldRows = fields
    .map(([label, value], i) => {
      const border = i === fields.length - 1 ? "" : "border-bottom:1px solid #EDEAE3;";
      return `
        <tr>
          <td style="padding:14px 16px 14px 0;${border}vertical-align:top;width:38%;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8A8F96;">${escapeHtml(label)}</td>
          <td style="padding:14px 0;${border}vertical-align:top;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.45;color:#1A1D21;">${value}</td>
        </tr>`;
    })
    .join("");

  const messageBlock = payload.message
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
        <tr>
          <td style="padding:16px 18px;background-color:#FFF6E8;border-left:3px solid #FF8A00;border-radius:0 8px 8px 0;">
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8A8F96;margin-bottom:6px;">They added</div>
            <div style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1A1D21;white-space:pre-wrap;">${escapeHtml(payload.message)}</div>
          </td>
        </tr>
      </table>`
    : "";

  const lead = payload.company
    ? `<strong style="color:#1A1D21;font-weight:600;">${escapeHtml(payload.name)}</strong> from <strong style="color:#1A1D21;font-weight:600;">${escapeHtml(payload.company)}</strong> just registered interest in Fleetlix.`
    : `<strong style="color:#1A1D21;font-weight:600;">${escapeHtml(payload.name)}</strong> just registered interest in Fleetlix.`;

  const preheader = payload.company
    ? `${payload.name} from ${payload.company} just registered interest in Fleetlix.`
    : `${payload.name} just registered interest in Fleetlix.`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New registration of interest</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5F0;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:#F7F5F0;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F7F5F0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E5E2DB;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(26,29,33,0.04);">
          <tr>
            <td style="background-color:#1A1D21;padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.14em;color:#FFFFFF;">FLEETLIX</td>
                  <td align="right" style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#FF8A00;">Interest</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:3px;background-color:#FF8A00;line-height:3px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px 0;font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:24px;line-height:1.2;letter-spacing:-0.01em;color:#1A1D21;font-weight:700;">New registration of interest</h1>
              <p style="margin:0 0 24px 0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#3D434A;">${lead}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #EDEAE3;">${fieldRows}</table>
              ${messageBlock}
              <p style="margin:28px 0 0 0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#3D434A;">Reply to this email to respond to ${escapeHtml(firstName)} directly — their address is set as the reply-to.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F7F5F0;padding:20px 32px;border-top:1px solid #E5E2DB;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#8A8F96;">
              <span style="color:#3D434A;font-weight:600;">Submitted</span> ${escapeHtml(submittedAt)} · Europe/London<br>
              <span style="color:#3D434A;font-weight:600;">IP</span> ${escapeHtml(meta.ip || "—")}<br>
              <span style="color:#3D434A;font-weight:600;">Agent</span> ${escapeHtml(meta.userAgent || "—")}
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:18px 16px 0 16px;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#8A8F96;">
              Triggered by the Register interest form on <a href="https://fleetlix.com" style="color:#8A8F96;text-decoration:underline;">fleetlix.com</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { text, html };
}

async function sendEmail(env: Env, payload: ParsedPayload, meta: {
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
}) {
  const { text, html } = renderEmail(payload, meta);
  const subject = `Fleetlix interest · ${payload.name}${payload.company ? ` · ${payload.company}` : ""}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.INTEREST_FROM_EMAIL,
      to: [env.INTEREST_TO_EMAIL],
      reply_to: payload.email,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

function renderConfirmation(payload: ParsedPayload) {
  const firstName = payload.name.trim().split(/\s+/)[0] || payload.name;
  const summaryRows: Array<[string, string]> = [];
  if (payload.company) summaryRows.push(["Company", escapeHtml(payload.company)]);
  if (payload.fleet_size) {
    const formatted =
      payload.fleet_size === "Not sure"
        ? payload.fleet_size
        : `${payload.fleet_size} vehicles`;
    summaryRows.push(["Fleet size", escapeHtml(formatted)]);
  }
  if (payload.role) summaryRows.push(["Role", escapeHtml(payload.role)]);

  const summaryHtml = summaryRows.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;border-top:1px solid #EDEAE3;">
        ${summaryRows
          .map(
            ([label, value], i) => {
              const border = i === summaryRows.length - 1 ? "" : "border-bottom:1px solid #EDEAE3;";
              return `<tr><td style="padding:12px 16px 12px 0;${border}vertical-align:top;width:38%;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8A8F96;">${escapeHtml(label)}</td><td style="padding:12px 0;${border}vertical-align:top;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.45;color:#1A1D21;">${value}</td></tr>`;
            },
          )
          .join("")}
      </table>`
    : "";

  const textLines = [
    `Hi ${firstName},`,
    "",
    "Thanks for registering interest in Fleetlix. Your details have landed safely and we'll be in touch the moment there's something real to show you — typically when we open the pilot programme.",
    "",
    "What you sent us:",
    `  Name:  ${payload.name}`,
    `  Email: ${payload.email}`,
    payload.company ? `  Company: ${payload.company}` : null,
    payload.fleet_size ? `  Fleet size: ${payload.fleet_size}` : null,
    payload.role ? `  Role: ${payload.role}` : null,
    "",
    "If anything looks wrong, just reply to this email and we'll fix it.",
    "",
    "— Chris",
    "Founder, Fleetlix",
    "Glasgow, Scotland",
  ].filter((line): line is string => line !== null);

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Thanks for registering interest in Fleetlix</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5F0;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:#F7F5F0;">We've received your interest in Fleetlix — confirmation inside.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#F7F5F0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#FFFFFF;border:1px solid #E5E2DB;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(26,29,33,0.04);">
          <tr>
            <td style="background-color:#1A1D21;padding:26px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:0.14em;color:#FFFFFF;">FLEETLIX</td>
                  <td align="right" style="font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#FF8A00;">Confirmation</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:3px;background-color:#FF8A00;line-height:3px;font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 14px 0;font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:24px;line-height:1.2;letter-spacing:-0.01em;color:#1A1D21;font-weight:700;">Thanks, ${escapeHtml(firstName)} — you're on the list.</h1>
              <p style="margin:0 0 16px 0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#3D434A;">Your details have landed safely. We'll be in touch the moment there's something real to show you — typically when the pilot programme opens to its first five operators.</p>
              <p style="margin:0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#3D434A;">No marketing lists, no third parties, no chasing — that's a promise.</p>
              ${summaryHtml}
              <p style="margin:28px 0 0 0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#3D434A;">If anything above looks wrong, just hit Reply and we'll fix it.</p>
              <p style="margin:24px 0 0 0;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1A1D21;">— Chris<br><span style="color:#8A8F96;">Founder, Fleetlix · Glasgow, Scotland</span></p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#F7F5F0;padding:18px 32px;border-top:1px solid #E5E2DB;font-family:'Inter',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#8A8F96;">
              Fleetlix is a product of CN-DESIGN LTD (Scotland · SC885094 · ICO CSN2072529).<br>You're receiving this because you registered interest at <a href="https://fleetlix.com" style="color:#8A8F96;text-decoration:underline;">fleetlix.com</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: "Thanks for registering interest in Fleetlix",
    text: textLines.join("\n"),
    html,
  };
}

async function sendConfirmation(env: Env, payload: ParsedPayload) {
  const { subject, text, html } = renderConfirmation(payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.INTEREST_FROM_EMAIL,
      to: [payload.email],
      reply_to: env.INTEREST_TO_EMAIL,
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  if (!env.RESEND_API_KEY || !env.INTEREST_TO_EMAIL || !env.INTEREST_FROM_EMAIL) {
    console.error("register-interest: missing required env vars");
    return json(500, { error: "Server is not configured to accept submissions yet." });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const parsed = Payload.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json(400, { error: "Invalid submission.", fieldErrors });
  }

  const ip = request.headers.get("CF-Connecting-IP");
  const userAgent = request.headers.get("User-Agent");

  if (env.TURNSTILE_SECRET_KEY) {
    if (!parsed.data.turnstile_token) {
      return json(400, { error: "Missing Turnstile token." });
    }
    const ok = await verifyTurnstile(
      env.TURNSTILE_SECRET_KEY,
      parsed.data.turnstile_token,
      ip,
    );
    if (!ok) return json(400, { error: "Turnstile check failed." });
  }

  try {
    await sendEmail(env, parsed.data, {
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("register-interest: send failed", err);
    return json(502, { error: "Couldn't deliver the message. Try again shortly." });
  }

  // Acknowledgement to the registrant. Best-effort: a delivery failure here
  // must not surface as an error to the user, because the lead-to-contact
  // email has already succeeded above. Log and move on.
  try {
    await sendConfirmation(env, parsed.data);
  } catch (err) {
    console.error("register-interest: confirmation send failed", err);
  }

  return json(200, { ok: true });
};
