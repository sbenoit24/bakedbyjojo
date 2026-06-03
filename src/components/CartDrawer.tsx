import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { cookies as cookieData } from "@/data/cookies";
import { useCart, type CartItems } from "@/hooks/use-cart";
import { cartToLineItems, isCheckoutConfigured, startCheckout, type Fulfillment } from "@/lib/checkout";
import { CLOSED_DATES } from "@/data/closed-dates";
import { PICKUP_WINDOW_DAYS, parseLocalDate, slotsForDay, toISOWithOffset } from "@/lib/pickup";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type OrderLine = (typeof cookieData)[number] & { dozens: number };

// Turn a slug -> dozens map into display rows joined to the cookie catalogue.
const toLines = (items: CartItems): OrderLine[] =>
  cookieData.filter((c) => (items[c.slug] ?? 0) > 0).map((c) => ({ ...c, dozens: items[c.slug] }));

function QtyStepper({
  dozens,
  onDecrement,
  onIncrement,
}: {
  dozens: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border">
      <button
        type="button"
        onClick={onDecrement}
        aria-label="Remove one dozen"
        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-semibold text-foreground">
        {dozens} dz
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label="Add one dozen"
        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const {
    cookieItems,
    platters,
    addDozen,
    setDozens,
    removeItem,
    setPlatterDozens,
    removePlatterItem,
    totalDozens,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);

  // Pickup scheduling. `today` stays null until the client mounts so we never
  // call new Date() during render — keeps SSR and first client render identical.
  const [today, setToday] = useState<Date | null>(null);
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [pickupSlot, setPickupSlot] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    setToday(new Date(now.getFullYear(), now.getMonth(), now.getDate())); // local midnight
  }, []);

  // Earliest = tomorrow, latest = today + window. Out-of-range days are disabled
  // (greyed/unclickable) along with any configured closed dates.
  const tomorrow = today
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    : undefined;
  const maxDate = today
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + PICKUP_WINDOW_DAYS)
    : undefined;
  const disabledDays =
    tomorrow && maxDate
      ? [{ before: tomorrow }, { after: maxDate }, ...CLOSED_DATES.map(parseLocalDate)]
      : undefined;
  const slots = pickupDate ? slotsForDay(pickupDate.getDay()) : [];
  const pickupReady = !!pickupDate && pickupSlot !== null;

  const cookieLines = toLines(cookieItems);
  const platterGroups = platters
    .map((items, index) => ({ index, lines: toLines(items) }))
    .filter((g) => g.lines.length > 0);
  const hasOrder = cookieLines.length > 0 || platterGroups.length > 0;

  const subtotal =
    cookieLines.reduce((sum, c) => sum + c.price * c.dozens, 0) +
    platterGroups.reduce((sum, g) => sum + g.lines.reduce((s, c) => s + c.price * c.dozens, 0), 0);

  const handleCheckout = async () => {
    const items = cartToLineItems(cookieItems, platters);
    if (items.length === 0 || !fulfillment) return;

    let pickupAt: string | undefined;
    if (fulfillment === "pickup") {
      if (!pickupDate || pickupSlot === null) return; // need both date and time
      pickupAt = toISOWithOffset(pickupDate, pickupSlot);
    }

    setError(null);
    setLoading(true);
    try {
      await startCheckout(items, fulfillment, pickupAt);
      // On success the browser redirects to Stripe, so we never reach here.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Open cart${totalDozens > 0 ? ` (${totalDozens} dozen)` : ""}`}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ShoppingBag className="h-5 w-5" />
          {totalDozens > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-accent-foreground">
              {totalDozens}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl text-primary">Your cart</SheetTitle>
          <SheetDescription>
            {hasOrder
              ? "Sold by the dozen. Check out securely with Stripe."
              : "Your cart is empty — add a dozen to get started."}
          </SheetDescription>
        </SheetHeader>

        {!hasOrder ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
            <Link
              to="/cookies"
              onClick={() => setOpen(false)}
              className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all"
            >
              Browse the cookie jar
            </Link>
          </div>
        ) : (
          <>
            <div className="-mx-6 flex-1 overflow-y-auto px-6">
              <div className="py-4">
              {cookieLines.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Cookies by the dozen
                  </h3>
                  {cookieLines.map((c) => (
                    <div key={c.slug} className="flex items-center gap-3">
                      <img
                        src={c.image}
                        alt=""
                        className="h-14 w-14 flex-none rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${c.price} / dozen · ${c.price * c.dozens}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <QtyStepper
                            dozens={c.dozens}
                            onDecrement={() => setDozens(c.slug, c.dozens - 1)}
                            onIncrement={() => addDozen(c.slug)}
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(c.slug)}
                            aria-label={`Remove ${c.name}`}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {platterGroups.map((group) => (
                <div key={group.index} className="mt-6 space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Platter {group.index + 1}
                  </h3>
                  {group.lines.map((c) => (
                    <div key={c.slug} className="flex items-center gap-3">
                      <img
                        src={c.image}
                        alt=""
                        className="h-14 w-14 flex-none rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ${c.price} / dozen · ${c.price * c.dozens}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <QtyStepper
                            dozens={c.dozens}
                            onDecrement={() => setPlatterDozens(group.index, c.slug, c.dozens - 1)}
                            onIncrement={() => setPlatterDozens(group.index, c.slug, c.dozens + 1)}
                          />
                          <button
                            type="button"
                            onClick={() => removePlatterItem(group.index, c.slug)}
                            aria-label={`Remove ${c.name} from platter ${group.index + 1}`}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              </div>

              <div className="border-t border-border pt-4 pb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-xl font-semibold text-primary">${subtotal}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Shipping and taxes are calculated at checkout.
              </p>

              {error && (
                <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}
              {!isCheckoutConfigured && (
                <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Card checkout isn't configured yet. You can still place a pickup order on the
                  Order page.
                </p>
              )}

              <fieldset className="mt-4">
                <legend className="text-xs font-semibold uppercase tracking-wider text-accent">
                  How would you like to get your cookies?
                </legend>
                <div className="mt-2 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillment("pickup")}
                    aria-pressed={fulfillment === "pickup"}
                    className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                      fulfillment === "pickup"
                        ? "border-accent bg-secondary text-primary"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Local pickup</span>
                    <span className="block text-xs text-muted-foreground">
                      Free — Westchester, NY
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFulfillment("shipping");
                      setPickupDate(undefined);
                      setPickupSlot(null);
                    }}
                    aria-pressed={fulfillment === "shipping"}
                    className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                      fulfillment === "shipping"
                        ? "border-accent bg-secondary text-primary"
                        : "border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="block text-sm font-semibold">Ship to me</span>
                    <span className="block text-xs text-muted-foreground">
                      NY only, calculated at checkout
                    </span>
                  </button>
                </div>
              </fieldset>

              {fulfillment === "pickup" && (
                <div className="mt-4 rounded-xl border border-border p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Pick a pickup time
                  </p>
                  <Calendar
                    mode="single"
                    selected={pickupDate}
                    onSelect={(d) => {
                      setPickupDate(d);
                      setPickupSlot(null);
                    }}
                    disabled={disabledDays}
                    startMonth={today ?? undefined}
                    endMonth={maxDate ?? undefined}
                    className="mx-auto mt-2"
                  />
                  {pickupDate ? (
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.minutes}
                          type="button"
                          onClick={() => setPickupSlot(s.minutes)}
                          aria-pressed={pickupSlot === s.minutes}
                          className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
                            pickupSlot === s.minutes
                              ? "border-accent bg-secondary text-primary"
                              : "border-border text-foreground hover:bg-secondary"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-center text-xs text-muted-foreground">
                      Choose a date to see available times.
                    </p>
                  )}
                </div>
              )}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || !fulfillment || (fulfillment === "pickup" && !pickupReady)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Redirecting…
                  </>
                ) : (
                  <>Checkout · ${subtotal}</>
                )}
              </button>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="mt-2 block text-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Prefer local pickup? Place an order →
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
