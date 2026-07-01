// Netlify serverless function: deliver a contact/order-form submission.
//
// The order & contact form (src/routes/contact.tsx) POSTs the composed order
// here and we email it to the shop owner via Resend — the SAME verified-domain
// pipeline the Stripe webhook uses, so every order (paid checkout OR custom
// request) provably lands in OWNER_EMAIL's inbox and nowhere else.
//
// Required env vars (already set in Netlify):
//   RESEND_API_KEY, OWNER_EMAIL
//
// We deliberately do NOT trust any recipient from the request body — the
// destination is always process.env.OWNER_EMAIL.

import { Resend } from "resend";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Guard against header injection via a customer-supplied reply-to address.
const isEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const owner = process.env.OWNER_EMAIL;
  if (!apiKey || !owner) {
    return json(500, {
      error: "Email is not configured. Set RESEND_API_KEY and OWNER_EMAIL.",
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const customerName =
    typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim()
      : "a customer";
  const subject =
    typeof payload.subject === "string" && payload.subject.trim()
      ? payload.subject.trim()
      : `New cookie order from ${customerName}`;
  const message = typeof payload.message === "string" ? payload.message : "";

  if (!message.trim()) {
    return json(400, { error: "Order details are empty" });
  }

  const resend = new Resend(apiKey);

  // Let Joann reply straight to the customer when a valid email was provided.
  const replyTo = isEmail(payload.email) ? payload.email : undefined;

  try {
    const { error } = await resend.emails.send({
      from: "Baked by JoJo <orders@bakedbyjojo.com>",
      to: owner,
      replyTo,
      subject,
      text: message,
      html: `<pre style="font-family:inherit;white-space:pre-wrap;margin:0">${escapeHtml(message)}</pre>`,
    });
    if (error) {
      console.error("Resend rejected order email:", error);
      return json(502, { error: "Email provider rejected the message" });
    }
  } catch (err) {
    console.error("Failed to send order email:", err);
    return json(502, { error: "Unable to send order email" });
  }

  return json(200, { success: true });
};
