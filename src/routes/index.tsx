import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-cookies.webp";
import { cookies } from "@/data/cookies";
import { ArrowRight, Heart, Truck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "bakedbyjojo — Homemade Cookies, Baked with Love" },
      { name: "description", content: "Small-batch homemade cookies from Joann Sachs. Order online for local pickup or statewide shipping." },
      { property: "og:title", content: "bakedbyjojo" },
      { property: "og:description", content: "Small-batch homemade cookies, baked with love." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featured = cookies.slice(0, 3);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Hand-baked in small batches
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-primary">
              Cookies that taste<br />like <em className="italic text-accent">home</em>.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Joann Sachs bakes every cookie by hand in her kitchen. Every cookie is made
              using real butter, pure vanilla, and family recipes passed down through generations.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/cookies"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all"
              >
                Browse the cookie jar <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-primary hover:bg-secondary transition"
              >
                Meet Joann
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-transparent rounded-[2rem] blur-2xl" />
            <img
              src={heroImage}
              alt="Assortment of homemade cookies on parchment paper"
              width={1536}
              height={1024}
              className="relative rounded-[2rem] shadow-warm w-full h-auto object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* Promise strip */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 sm:grid-cols-3 text-center">
          {[
            { icon: Heart, title: "Made by hand", body: "Every batch baked personally by Joann." },
            { icon: Sparkles, title: "Real ingredients", body: "Real butter, pure vanilla, premium chocolate." },
            { icon: Truck, title: "Pickup & shipping", body: "Local pickup and statewide shipping." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-2">
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="font-display text-lg font-semibold text-primary">{f.title}</h3>
              <p className="text-sm text-muted-foreground max-w-[14rem]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured cookies */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium text-accent uppercase tracking-wider">This week's batch</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl font-semibold text-primary">
              Customer favorites
            </h2>
          </div>
          <Link to="/cookies" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-accent">
            View all cookies <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((c) => (
            <article key={c.slug} className="group rounded-3xl bg-card overflow-hidden shadow-soft hover:shadow-warm transition-shadow">
              <div className="aspect-square overflow-hidden">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  width={768}
                  height={768}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6">
                {c.badge && (
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                    {c.badge}
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold text-primary">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
                <p className="mt-4 text-sm font-semibold text-foreground">${c.price} / dozen</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex items-center justify-center gap-3 mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary text-center">
            Best Kept Secrets
          </h2>
          <ArrowRight className="h-7 w-7 text-accent shrink-0" />
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6">
          {[
            {
              quote:
                "I even put the Figgie's Favorite into a yogurt parfait yesterday, and it was better than having an ice cream sundae",
              author: "Nelson Figueroa",
            },
            {
              quote:
                "The Peppermint Bliss cookies were the perfect amount of mint and delicious cookie that should follow every meal",
              author: "Carol Ann Hart",
            },
            {
              quote:
                "I live and breathe these cookies, I can not get enough. All day everyday.",
              author: "Sam",
            },
          ].map((t) => (
            <figure
              key={t.author}
              className="snap-start shrink-0 w-[85%] sm:w-[28rem] rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 flex flex-col justify-between"
            >
              <blockquote className="font-display text-xl md:text-2xl font-semibold leading-snug">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 text-sm text-primary-foreground/70">
                — {t.author}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-secondary/40 p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">
            Ready to fill your cookie jar?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Order by the dozen for parties, gifts, weddings, or a quiet Tuesday afternoon.
          </p>
          <Link
            to="/cookies"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all"
          >
            Place an order <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
