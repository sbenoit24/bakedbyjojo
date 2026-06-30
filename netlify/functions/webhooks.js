// Netlify serverless function: Stripe webhook receiver.
//
// Stripe POSTs events here. We verify the signature, and on a completed
// checkout we email the shop owner the order details via Resend.
//
// Required env vars:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, OWNER_EMAIL
//
// Clients are constructed inside the handler (same pattern as
// create-checkout-session.js) to dodge Netlify Dev env-var timing issues.

import Stripe from "stripe";
import { Resend } from "resend";

const usd = (cents) => `$${(cents / 100).toFixed(2)}`;

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Verify the Stripe signature against the RAW body — never JSON.parse first.
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook signature verification failed: ${err.message}`,
    };
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "Ignored" };
  }

  const session = await stripe.checkout.sessions.retrieve(
    stripeEvent.data.object.id,
    {
      expand: [
        "line_items",
        "line_items.data.price.product",
        "customer_details",
        "shipping_cost.shipping_rate",
      ],
    },
  );

  // --- gather order details ---
  const customerName = session.customer_details?.name || "Unknown";
  const customerEmail = session.customer_details?.email || "Unknown";

  const shippingRate = session.shipping_cost?.shipping_rate;
  const shippingName = shippingRate?.display_name || "—";
  const shippingCost = session.shipping_cost?.amount_total ?? 0;
  const isPickup = shippingCost === 0 || /pickup/i.test(shippingName);

  // Scheduled pickup time, set as metadata when the session was created. Format
  // for Joann (the shop owner) in New York time, e.g.
  // "Saturday, June 7, 2026 at 2:30 PM".
  const pickupAtIso = session.metadata?.pickup_at;
  let pickupTime = "";
  if (pickupAtIso) {
    const d = new Date(pickupAtIso);
    if (!Number.isNaN(d.getTime())) {
      const tz = { timeZone: "America/New_York" };
      const datePart = d.toLocaleDateString("en-US", {
        ...tz,
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const timePart = d.toLocaleTimeString("en-US", {
        ...tz,
        hour: "numeric",
        minute: "2-digit",
      });
      pickupTime = `${datePart} at ${timePart}`;
    }
  }

  // Shipping address moved from session.shipping_details to
  // session.collected_information.shipping_details in newer API versions —
  // check both so this works regardless.
  const shippingAddr =
    session.collected_information?.shipping_details?.address ||
    session.shipping_details?.address ||
    null;

  const formatAddr = (a) =>
    [a.line1, a.line2, `${a.city}, ${a.state} ${a.postal_code}`, a.country]
      .filter(Boolean)
      .join("\n");

  const lineItems = session.line_items?.data || [];
  const itemLines = lineItems.map((li) => ({
    name: li.price?.product?.name || li.description || "Item",
    quantity: li.quantity,
    unit: li.price?.unit_amount ?? 0,
    lineTotal: li.amount_total,
  }));

  const orderTotal = session.amount_total ?? 0;

  // --- build text + HTML ---
  const subject = `New order — ${usd(orderTotal)} from ${customerName}`;

  const shippingBlock = isPickup
    ? `Method: Local pickup — Westchester, NY${pickupTime ? `\nPickup time: ${pickupTime}` : ""}`
    : `Method: ${shippingName}\nShip to:\n${
        shippingAddr ? formatAddr(shippingAddr) : "(no address on file)"
      }`;

  const text = [
    `New order from ${customerName} <${customerEmail}>`,
    "",
    shippingBlock,
    "",
    "Items:",
    ...itemLines.map(
      (i) =>
        `  ${i.name} — ${i.quantity} × ${usd(i.unit)} = ${usd(i.lineTotal)}`,
    ),
    "",
    `Shipping: ${usd(shippingCost)}`,
    `Order total: ${usd(orderTotal)}`,
    "",
    `Stripe session: ${session.id}`,
  ].join("\n");

  const html = `
    <h2>New order — ${usd(orderTotal)}</h2>
    <p><strong>${customerName}</strong> &lt;${customerEmail}&gt;</p>
    <p style="white-space:pre-line">${shippingBlock}</p>
    <table cellpadding="6" style="border-collapse:collapse">
      <thead><tr><th align="left">Item</th><th>Qty</th><th align="right">Unit</th><th align="right">Total</th></tr></thead>
      <tbody>
        ${itemLines
          .map(
            (i) =>
              `<tr><td>${i.name}</td><td align="center">${i.quantity}</td><td align="right">${usd(i.unit)}</td><td align="right">${usd(i.lineTotal)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
    <p>Shipping: ${usd(shippingCost)}<br/><strong>Order total: ${usd(orderTotal)}</strong></p>
    <p style="color:#888">Stripe session: ${session.id}</p>
  `;

  // Email failures must NOT trigger a non-200 — Stripe would retry and we'd
  // send duplicate emails. Log and move on.
  try {
    await resend.emails.send({
      // Must be an address on a Resend-verified domain (bakedbyjojo.com).
      // The shared onboarding@resend.dev sandbox sender can ONLY deliver to the
      // Resend account owner's own inbox, which would silently drop every real
      // order — so we send from the verified domain instead.
      from: "Baked by JoJo <orders@bakedbyjojo.com>",
      to: process.env.OWNER_EMAIL,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Failed to send order email:", err);
  }

  return { statusCode: 200, body: "OK" };
};
