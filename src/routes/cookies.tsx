import { createFileRoute, Link } from "@tanstack/react-router";
import { cookies } from "@/data/cookies";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "The Cookie Menu — bakedbyjojo" },
      { name: "description", content: "Browse Joann's full cookie menu — chocolate chip, sugar, oatmeal, snickerdoodle, peanut butter, double chocolate, and more." },
      { property: "og:title", content: "The Cookie Menu — bakedbyjojo" },
      { property: "og:description", content: "Browse Joann's homemade cookie menu." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <header className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">The menu</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold text-primary">
          The cookie jar
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Sold by the dozen. Mix-and-match boxes available — just ask.
        </p>
      </header>

      <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {cookies.map((c) => (
          <article key={c.slug} className="rounded-3xl bg-card overflow-hidden shadow-soft hover:shadow-warm transition-shadow group">
            <div className="aspect-[4/3] overflow-hidden relative bg-muted">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                width={768}
                height={576}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              {c.badge && (
                <span className="absolute top-4 left-4 rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1">
                  {c.badge}
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-primary">{c.name}</h2>
                <span className="font-semibold text-foreground">${c.price}</span>
              </div>
              <p className="mt-1 text-sm italic text-accent">{c.tagline}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
              <p className="mt-4 text-xs text-muted-foreground uppercase tracking-wider">Per dozen</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link
          to="/contact"
          className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all"
        >
          Place an order
        </Link>
      </div>
    </div>
  );
}
