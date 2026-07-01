import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { cookies } from "@/data/cookies";
import { useCart } from "@/hooks/use-cart";

// Where placed orders are sent. The /send-order Netlify function delivers each
// submission here server-side via Resend's verified bakedbyjojo.com domain — the
// same pipeline the Stripe order webhook uses — so the recipient is fixed in the
// backend (process.env.OWNER_EMAIL) and can't be redirected from the client.
const ORDER_EMAIL = "bakedbyjojo124@gmail.com";
const SEND_ORDER_ENDPOINT = "/.netlify/functions/send-order";

// Today as YYYY-MM-DD in the customer's local timezone — used as the date
// input's `min` so past days can't be selected.
function todayLocalISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// A "YYYY-MM-DD" string falls on a weekend? Parse the parts explicitly so the
// date is read in local time (new Date("YYYY-MM-DD") would parse as UTC and can
// shift the weekday across timezones).
function isWeekendISO(dateStr: string) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day === 0 || day === 6;
}

// Half-hour pickup slots from startHour to endHour inclusive (24-hour input),
// formatted like "5:00 pm". The end hour only contributes its on-the-hour slot.
function buildTimeSlots(startHour: number, endHour: number) {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (const min of [0, 30]) {
      if (h === endHour && min > 0) break;
      const hour12 = ((h + 11) % 12) + 1;
      const ampm = h >= 12 ? "pm" : "am";
      slots.push(`${hour12}:${min === 0 ? "00" : "30"} ${ampm}`);
    }
  }
  return slots;
}

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Order & Contact — bakedbyjojo" },
      { name: "description", content: "Place an order or get in touch with Joann. Local pickup and statewide shipping available." },
      { property: "og:title", content: "Order from bakedbyjojo" },
      { property: "og:description", content: "Place an order or get in touch with Joann." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Shipping needs a delivery address; pickup doesn't. Track the choice so the
  // address question only appears when the customer picks shipping.
  const [isShipping, setIsShipping] = useState(false);
  // The chosen "needed by" date drives which pickup times are offered:
  // weekdays run 5pm–8pm, weekends 1pm–7pm.
  const [date, setDate] = useState("");
  const minDate = todayLocalISO();
  const isWeekend = isWeekendISO(date);
  const pickupSlots = isWeekend ? buildTimeSlots(13, 19) : buildTimeSlots(17, 20);
  const pickupWindowLabel = isWeekend ? "1pm–7pm" : "5pm–8pm";
  const sent = status === "sent";
  const {
    cookieItems,
    platters,
    addDozen,
    setDozens,
    removeItem,
    setPlatterDozens,
    removePlatterItem,
    clear,
    cookieDozens,
    totalDozens,
  } = useCart();

  const toLines = (items: typeof cookieItems) =>
    cookies
      .filter((c) => (items[c.slug] ?? 0) > 0)
      .map((c) => ({ ...c, dozens: items[c.slug] }));

  const cookieLines = toLines(cookieItems);
  // Keep each platter as its own group, remembering its index so edits target
  // the right platter in the cart.
  const platterGroups = platters
    .map((items, index) => ({ index, lines: toLines(items), items }))
    .filter((g) => g.lines.length > 0);
  const hasOrder = cookieLines.length > 0 || platterGroups.length > 0;
  const totalPrice =
    cookieLines.reduce((sum, c) => sum + c.price * c.dozens, 0) +
    platterGroups.reduce(
      (sum, g) => sum + g.lines.reduce((s, c) => s + c.price * c.dozens, 0),
      0,
    );

  // Compose the order as a plain-text summary and deliver it to the bakery
  // inbox. We build the body before clearing the cart so the just-submitted
  // order isn't lost.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const customerName = (form.get("name") as string) || "a customer";

    const body: string[] = [];
    const renderLines = (lines: OrderLine[]) =>
      lines.forEach((c) =>
        body.push(`  ${c.dozens} dozen ${c.name} — $${c.price * c.dozens}`),
      );

    if (cookieLines.length > 0) {
      body.push("Cookie order:");
      renderLines(cookieLines);
      body.push("");
    }
    platterGroups.forEach((g, position) => {
      body.push(platterGroups.length > 1 ? `Platter ${position + 1}:` : "Platter order:");
      renderLines(g.lines);
      body.push("");
    });
    body.push(`Total: ${totalDozens} ${totalDozens === 1 ? "dozen" : "dozens"} — $${totalPrice}`);
    body.push("");
    body.push(`Name: ${customerName}`);
    body.push(`Email: ${form.get("email") || "—"}`);
    body.push(`Phone: ${form.get("phone") || "—"}`);
    body.push(`Needed by: ${form.get("date") || "—"}`);
    body.push(`Fulfillment: ${form.get("fulfillment") || "—"}`);
    if (!isShipping) body.push(`Pickup time: ${form.get("pickup_time") || "—"}`);
    if (isShipping) body.push(`Shipping address: ${form.get("address") || "—"}`);

    const subject = `New cookie order from ${customerName}`;
    const message = body.join("\n");

    setStatus("sending");
    try {
      const res = await fetch(SEND_ORDER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          subject,
          name: customerName,
          // Lets Joann reply straight to the customer from the order email.
          email: form.get("email"),
          message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error ?? "Submission failed");
      setStatus("sent");
      clear();
    } catch {
      // Last-ditch fallback so an order is never silently dropped: open the
      // customer's mail client pre-addressed to the bakery inbox.
      window.location.href = `mailto:${ORDER_EMAIL}?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(message)}`;
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <header className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">Order & contact</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold text-primary">
          Let's bake something for you.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Tell Joann what you'd like, when you need it, and where it's going. She'll be in touch within a day.
        </p>
      </header>

      <div className="mt-14 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-card border border-border p-8 md:p-10 shadow-soft space-y-5"
          >
            <p className="rounded-xl bg-secondary/60 px-4 py-2.5 text-center text-sm font-medium text-primary">
              Shipping only in NY state
            </p>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Your order</label>
              {!hasOrder ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
                  Your cart is empty.{" "}
                  <Link to="/cookies" className="font-medium text-accent hover:underline">
                    Browse the cookies
                  </Link>{" "}
                  and add a dozen to get started.
                </div>
              ) : (
                <div className="space-y-5">
                  {cookieLines.length > 0 && (
                    <OrderSection
                      title="Cookie order"
                      subtitle="Sold by the dozen"
                      lines={cookieLines}
                      onDecrement={(slug, dozens) => setDozens(slug, dozens - 1)}
                      onIncrement={(slug) => addDozen(slug)}
                      onRemove={removeItem}
                      sectionDozens={cookieDozens}
                    />
                  )}
                  {platterGroups.map((g, position) => (
                    <OrderSection
                      key={g.index}
                      title={platterGroups.length > 1 ? `Platter ${position + 1}` : "Platter order"}
                      subtitle="2 dozen minimum, mix & match"
                      lines={g.lines}
                      onDecrement={(slug, dozens) => setPlatterDozens(g.index, slug, dozens - 1)}
                      onIncrement={(slug) => setPlatterDozens(g.index, slug, (g.items[slug] ?? 0) + 1)}
                      onRemove={(slug) => removePlatterItem(g.index, slug)}
                      sectionDozens={g.lines.reduce((sum, l) => sum + l.dozens, 0)}
                    />
                  ))}
                  <div className="space-y-1 px-1 text-sm font-semibold text-primary">
                    <div className="flex items-center justify-between">
                      <span>Total cookies</span>
                      <span>{totalDozens} {totalDozens === 1 ? "dozen" : "dozens"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total price</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone" name="phone" type="tel" />
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Needed by</label>
                <input
                  type="date"
                  name="date"
                  value={date}
                  min={minDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Pickup or shipping?</label>
              <select
                name="fulfillment"
                onChange={(e) => setIsShipping(e.target.value.startsWith("Ship"))}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option>Local pickup (Cookies and Platters)</option>
                <option>Ship anywhere in the state (Cookies Only no Platter)</option>
              </select>
            </div>
            {!isShipping && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Preferred pickup time ({pickupWindowLabel})
                </label>
                <select
                  // Remount when the window changes so the selection resets to a
                  // valid slot instead of keeping a now-unavailable time.
                  key={isWeekend ? "weekend" : "weekday"}
                  name="pickup_time"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {pickupSlots.map((slot) => (
                    <option key={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            )}
            {isShipping && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Shipping address</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  placeholder="Street address, city, NY, ZIP"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={(!hasOrder && !sent) || status === "sending"}
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {status === "sending"
                ? "Sending your order…"
                : sent
                  ? "Thanks! Joann will be in touch soon."
                  : "Send my order"}
            </button>
            {status === "error" && (
              <p className="text-center text-sm text-destructive">
                Something went wrong sending your order. Please try again, or email us at{" "}
                <a href={`mailto:${ORDER_EMAIL}`} className="font-medium underline">
                  {ORDER_EMAIL}
                </a>
                .
              </p>
            )}
            <div className="flex justify-center">
              <a
                href="https://venmo.com/u/Joann-Sachs-4"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-primary hover:bg-secondary/70 transition-colors"
              >
                Pay with Venmo
                <span className="font-semibold text-accent">@Joann-Sachs-4</span>
              </a>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-2 space-y-4">
          <InfoCard icon={Mail} title="Email" body="bakedbyjojo124@gmail.com" />
          <InfoCard icon={Phone} title="Phone" body="914-419-0765" />
          <InfoCard icon={MapPin} title="Service area" body="Local pickup and statewide shipping." />
        </aside>
      </div>
    </div>
  );
}

type OrderLine = (typeof cookies)[number] & { dozens: number };

function OrderSection({
  title,
  subtitle,
  lines,
  onDecrement,
  onIncrement,
  onRemove,
  sectionDozens,
}: {
  title: string;
  subtitle: string;
  lines: OrderLine[];
  onDecrement: (slug: string, dozens: number) => void;
  onIncrement: (slug: string) => void;
  onRemove: (slug: string) => void;
  sectionDozens: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between px-1 mb-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">{title}</h3>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-background">
        {lines.map((c) => (
          <li key={c.slug} className="flex items-center gap-3 px-4 py-3">
            <img
              src={c.image}
              alt={c.name}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-primary">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.dozens} dozen · ${c.price * c.dozens}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={`Remove one dozen ${c.name}`}
                onClick={() => onDecrement(c.slug, c.dozens)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-input text-foreground hover:bg-secondary transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-medium tabular-nums">{c.dozens}</span>
              <button
                type="button"
                aria-label={`Add one dozen ${c.name}`}
                onClick={() => onIncrement(c.slug)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-input text-foreground hover:bg-secondary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={`Remove ${c.name} from order`}
                onClick={() => onRemove(c.slug)}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between px-4 py-3 text-sm font-medium text-primary">
          <span>{title} subtotal</span>
          <span>{sectionDozens} dozen</span>
        </li>
      </ul>
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-primary mb-2">{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}

function InfoCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-5 flex gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold text-primary">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{body}</p>
      </div>
    </div>
  );
}
