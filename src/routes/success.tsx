import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/success")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Order confirmed — bakedbyjojo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { session_id } = Route.useSearch();
  const { clear } = useCart();

  useEffect(() => {
    if (typeof window === "undefined") return;
    clear();
  }, [clear]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15">
        <CheckCircle2 className="h-9 w-9 text-accent" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-semibold text-primary md:text-5xl">
        Thank you — your order is in!
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your payment was received and Joann has been notified. You'll get a confirmation email from
        Stripe with your receipt, and we'll be in touch about pickup or shipping.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Local pickup is at 74 Munson St, Port Chester, NY 10573.
      </p>
      {session_id && (
        <p className="mt-3 text-xs text-muted-foreground">
          Confirmation reference: <span className="font-mono">{session_id}</span>
        </p>
      )}
      <Link
        to="/cookies"
        className="mt-8 inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm transition-all hover:translate-y-[-1px]"
      >
        Back to the cookie jar
      </Link>
    </div>
  );
}