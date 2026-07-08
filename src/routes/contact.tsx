import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

const ORDER_EMAIL = "bakedbyjojo124@gmail.com";
const PHONE = "914-419-0765";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — bakedbyjojo" },
      { name: "description", content: "Get in touch with Joann. Local pickup in Port Chester, NY and statewide shipping available." },
      { property: "og:title", content: "Contact bakedbyjojo" },
      { property: "og:description", content: "Get in touch with Joann — local pickup and statewide shipping." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <header className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">Contact</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold text-primary">
          Get in touch with Joann.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Questions about your order, a custom request, or just want to say hello? Reach out any of these ways.
        </p>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        <ContactCard
          icon={Mail}
          title="Email"
          body={ORDER_EMAIL}
          href={`mailto:${ORDER_EMAIL}`}
        />
        <ContactCard
          icon={Phone}
          title="Phone"
          body={PHONE}
          href={`tel:${PHONE.replace(/[^0-9]/g, "")}`}
        />
        <ContactCard
          icon={MapPin}
          title="Pickup & service area"
          body="74 Munson St, Port Chester, NY 10573. Statewide shipping available."
        />
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-primary">{title}</h2>
      <p className="mt-2 text-base text-muted-foreground">{body}</p>
    </>
  );

  const className =
    "flex flex-col items-center text-center rounded-3xl bg-card border border-border p-8 md:p-10 shadow-soft transition-all";

  return href ? (
    <a href={href} className={`${className} hover:translate-y-[-2px] hover:shadow-warm`}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}
