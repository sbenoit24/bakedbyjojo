import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Order & Contact — bakedbyjojo" },
      { name: "description", content: "Place an order or get in touch with Joann. Pickup, local delivery, and statewide shipping available." },
      { property: "og:title", content: "Order from bakedbyjojo" },
      { property: "og:description", content: "Place an order or get in touch with Joann." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

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
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="rounded-3xl bg-card border border-border p-8 md:p-10 shadow-soft space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Your name" name="name" required />
              <Field label="Email" name="email" type="email" required />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone" name="phone" type="tel" />
              <Field label="Needed by" name="date" type="date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Cookie order</label>
              <textarea
                name="order"
                rows={5}
                placeholder="e.g. 2 dozen chocolate chip, 1 dozen frosted sugar — for a birthday Saturday."
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Pickup, delivery, or shipping?</label>
              <select
                name="fulfillment"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option>Local pickup</option>
                <option>Local delivery (within county)</option>
                <option>Ship anywhere in the state</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all"
            >
              {sent ? "Thanks! Joann will be in touch soon." : "Send my order"}
            </button>
          </form>
        </div>

        <aside className="lg:col-span-2 space-y-4">
          <InfoCard icon={Mail} title="Email" body="hello@bakedbyjojo.com" />
          <InfoCard icon={Phone} title="Phone" body="(555) 123-BAKE" />
          <InfoCard icon={MapPin} title="Service area" body="Local pickup & delivery in town and across the county. Shipping statewide." />
          <InfoCard icon={Clock} title="Bakery hours" body="Tuesday – Saturday, 9am – 5pm" />
        </aside>
      </div>
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
