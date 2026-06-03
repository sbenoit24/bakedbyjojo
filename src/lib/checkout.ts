import { cookies as cookieData } from "@/data/cookies";
import type { CartItems } from "@/hooks/use-cart";

// The Stripe publishable key is safe to ship in the client bundle. We mainly use
// it as a signal of whether Stripe Checkout has been configured for this build —
// the actual charge is created server-side by the Netlify function.
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as
  | string
  | undefined;

export const isCheckoutConfigured = Boolean(STRIPE_PUBLISHABLE_KEY);

const CHECKOUT_ENDPOINT = "/.netlify/functions/create-checkout-session";

export type LineItem = { priceId: string; quantity: number };
export type Fulfillment = "pickup" | "shipping";

// Flatten the whole cart — à-la-carte cookie dozens plus every platter — into a
// list of { priceId, quantity } items. Cookies are priced by the dozen, so the
// quantity is simply the total dozens of that cookie across the order. We send
// only the Stripe price ID and a quantity, never a price.
export function cartToLineItems(cookieItems: CartItems, platters: CartItems[]): LineItem[] {
  const dozensBySlug: Record<string, number> = {};
  const accumulate = (items: CartItems) => {
    for (const [slug, dozens] of Object.entries(items)) {
      if (dozens > 0) dozensBySlug[slug] = (dozensBySlug[slug] ?? 0) + dozens;
    }
  };
  accumulate(cookieItems);
  platters.forEach(accumulate);

  const bySlug = new Map(cookieData.map((c) => [c.slug, c]));
  const lineItems: LineItem[] = [];
  for (const [slug, quantity] of Object.entries(dozensBySlug)) {
    const cookie = bySlug.get(slug);
    if (cookie?.stripePriceId) {
      lineItems.push({ priceId: cookie.stripePriceId, quantity });
    }
  }
  return lineItems;
}

// Call the Netlify function to create a Checkout Session, then hand the browser
// off to Stripe's hosted checkout page. Throws on any failure so the caller can
// surface the message.
export async function startCheckout(
  items: LineItem[],
  fulfillment: Fulfillment,
  pickupAt?: string,
): Promise<void> {
  const res = await fetch(CHECKOUT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, fulfillment, ...(pickupAt ? { pickupAt } : {}) }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Checkout failed (${res.status})`);
  }

  const { url } = (await res.json()) as { url?: string };
  if (!url) throw new Error("Stripe did not return a checkout URL.");
  window.location.href = url;
}
