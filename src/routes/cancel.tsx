import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/cancel")({
  head: () => ({
    meta: [{ title: "Checkout canceled — bakedbyjojo" }, { name: "robots", content: "noindex" }],
  }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <XCircle className="h-9 w-9 text-muted-foreground" />
      </span>
      <h1 className="mt-6 font-display text-4xl font-semibold text-primary md:text-5xl">
        Checkout canceled
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        No worries — you haven't been charged. Your cart is still saved, so you can pick up right
        where you left off whenever you're ready.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/cookies"
          className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm transition-all hover:translate-y-[-1px]"
        >
          Back to the cookie jar
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Place a pickup order instead
        </Link>
      </div>
    </div>
  );
}
