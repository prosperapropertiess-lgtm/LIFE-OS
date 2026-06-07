// Sends email via Resend. From must be onboarding@resend.dev (or a verified
// domain); on the free tier it can only deliver to the Resend account's email.
export async function sendEmail(subject, html) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.EMAIL_TO;
  const from = process.env.EMAIL_FROM || "Life OS <onboarding@resend.dev>";
  if (!key || !to) throw new Error("Missing RESEND_API_KEY or EMAIL_TO");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  const ok = res.ok;
  let info = "";
  try { info = JSON.stringify(await res.json()); } catch (e) {}
  return { ok, status: res.status, info };
}

// Shared email shell — light, simple, mobile-friendly.
export function emailShell(heading, bodyHtml, buttonUrl, buttonLabel) {
  const btn = buttonUrl
    ? `<a href="${buttonUrl}" style="display:inline-block;background:#2f6bdd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:9px;font-weight:600;font-size:15px;margin-top:14px;">${buttonLabel || "Open"}</a>`
    : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1c2024;">
    <h2 style="font-size:20px;margin:0 0 12px;">${heading}</h2>
    <div style="font-size:15px;line-height:1.6;color:#33373c;">${bodyHtml}</div>
    ${btn}
    <p style="font-size:12px;color:#9aa1ab;margin-top:24px;">Sent by your Life OS dashboard.</p>
  </div>`;
}
