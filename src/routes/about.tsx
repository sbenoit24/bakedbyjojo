import { createFileRoute } from "@tanstack/react-router";
import joann from "@/assets/joannportrait.webp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Joann — bakedbyjojo" },
      { name: "description", content: "Meet Joann Sachs, the home baker behind bakedbyjojo — small-batch cookies made from family recipes in her own kitchen." },
      { property: "og:title", content: "About Joann Sachs" },
      { property: "og:description", content: "The home baker behind bakedbyjojo." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
      <div className="grid gap-12 md:grid-cols-2 items-center">
        <div className="relative mx-auto w-full max-h-[80vh]">
          <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-transparent rounded-[2rem] blur-2xl" />
          <img
            src={joann}
            alt="Joann Sachs holding a tray of fresh-baked cookies"
            loading="lazy"
            width={1024}
            height={1024}
            className="relative rounded-[2rem] shadow-warm w-full h-auto max-h-[80vh] object-contain mx-auto"
          />
        </div>
        <div className="space-y-5">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Hi, I'm Joann</p>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-primary leading-tight">
            Three generations of cookie love.
          </h1>
          <p className="text-lg text-muted-foreground">
            Baked By JoJo was born from Joann's love of baking delicious treats for friends and
            family. For years, her cookies have been the highlight of special occasions, bringing
            joy to gatherings and celebrations alike. Inspired by her passion for creating
            fan-favorite baked goods and helping people celebrate life's sweetest memories, Joann
            decided to share her scrumptious creations with others.
          </p>
        </div>
      </div>

      <section className="mt-24 grid gap-8 md:grid-cols-3">
        {[
          { n: "20+", label: "years of baking" },
          { n: "6", label: "signature varieties" },
          { n: "1,000+", label: "happy customers" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl bg-secondary/50 p-8 text-center">
            <p className="font-display text-5xl font-semibold text-accent">{s.n}</p>
            <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-24 rounded-3xl bg-primary text-primary-foreground p-10 md:p-16">
        <h2 className="font-display text-3xl md:text-4xl font-semibold max-w-2xl">
          My promise
        </h2>
        <p className="mt-4 text-primary-foreground/80 max-w-2xl text-lg">
          If a cookie isn't good enough for my own family table, it doesn't go in your box.
          That's the whole rule.
        </p>
      </section>
    </div>
  );
}
