// Netlify serverless function: create a Stripe Checkout Session.
//
// The browser POSTs a list of cart items — each { priceId, quantity } — and we
// turn them into a one-time-payment Checkout Session. The dollar amounts live in
// Stripe (referenced by `priceId`), never in this request, so the client can't
// tamper with what it's charged.
//
// Required env var (set in Netlify → Site settings → Environment variables):
//   STRIPE_SECRET_KEY = sk_live_… or sk_test_…
//
// Package.json has "type": "module", so this file is an ES module.

import Stripe from "stripe";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Best-effort origin for the post-checkout redirect URLs. Prefer the request's
// own origin (works for any custom/deploy-preview domain), then Netlify's
// built-in site URL, then localhost for `netlify dev`.
const resolveOrigin = (event) => {
  const headers = event.headers || {};
  if (headers.origin) return headers.origin.replace(/\/$/, "");
  const host = headers.host;
  if (host) {
    const proto = headers["x-forwarded-proto"] || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return (process.env.URL || "http://localhost:8888").replace(/\/$/, "");
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return json(500, {
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY in the environment.",
    });
  }

  let items, fulfillment;
  try {
    ({ items, fulfillment } = JSON.parse(event.body || "{}"));
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return json(400, { error: "No items provided" });
  }

  // Pickup vs shipping. Missing → default to "shipping" (backward compat).
  // Present but not one of the two valid strings → reject.
  if (fulfillment !== undefined && fulfillment !== "pickup" && fulfillment !== "shipping") {
    return json(400, { error: 'fulfillment must be "pickup" or "shipping"' });
  }
  const method = fulfillment === "pickup" ? "pickup" : "shipping";

  // Validate and normalise every line item before talking to Stripe.
  const lineItems = [];
  for (const item of items) {
    const priceId = item && item.priceId;
    const quantity = item && Number(item.quantity);
    if (typeof priceId !== "string" || !priceId) {
      return json(400, { error: "Each item needs a string priceId" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return json(400, { error: `Invalid quantity for ${priceId}` });
    }
    lineItems.push({ price: priceId, quantity });
  }

  const stripe = new Stripe(secretKey);
  const origin = resolveOrigin(event);

  // Each line item is one dozen cookies. NY-only USPS rate scales with dozens:
  // $6 for the first dozen, +$1 per additional dozen.
  const totalQuantity = lineItems.reduce((sum, li) => sum + li.quantity, 0);
  const shippingCents = 600 + (totalQuantity - 1) * 100;

  const sessionConfig = {
    mode: "payment",
    line_items: lineItems,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
    billing_address_collection: "auto",
  };

  if (method === "pickup") {
    // No address form needed; collect a phone so we can coordinate pickup.
    sessionConfig.phone_number_collection = { enabled: true };
    sessionConfig.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: "Local pickup (Westchester, NY)",
        },
      },
    ];
  } else {
    sessionConfig.shipping_address_collection = { allowed_countries: ["US"] };
    sessionConfig.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: shippingCents, currency: "usd" },
          display_name: "USPS Priority Shipping — NY only",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 2 },
            maximum: { unit: "business_day", value: 5 },
          },
        },
      },
    ];
    sessionConfig.custom_text = {
      shipping_address: {
        message:
          "Shipping is currently only available within New York State. If you live outside NY, please choose Local pickup.",
      },
    };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionConfig);
    return json(200, { url: session.url, id: session.id });
  } catch (err) {
    // Surface Stripe's message (e.g. a bad price ID) so the client can show it.
    const message = err && err.message ? err.message : "Unable to create checkout session";
    return json(502, { error: message });
  }
};
