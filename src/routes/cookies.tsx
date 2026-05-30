import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { cookies, type Cookie } from "@/data/cookies";
import { useCart } from "@/hooks/use-cart";

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
          <CookieCard key={c.slug} cookie={c} />
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

      <PlatterSection />
    </div>
  );
}

function CookieCard({ cookie: c }: { cookie: Cookie }) {
  const { addDozen, cookieItems } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const dozensOrdered = cookieItems[c.slug] ?? 0;

  const handleAdd = () => {
    addDozen(c.slug);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <article className="rounded-3xl bg-card overflow-hidden shadow-soft hover:shadow-warm transition-shadow group flex flex-col">
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
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-primary">{c.name}</h2>
          <span className="font-semibold text-foreground">${c.price}</span>
        </div>
        <p className="mt-1 text-sm italic text-accent">{c.tagline}</p>
        <div className="mt-4 space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Ingredients</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.ingredients}</p>
          </div>
          <p className="text-xs font-medium text-foreground leading-relaxed">{c.allergens}</p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Per dozen</p>
          <div className="flex items-center gap-2">
            {dozensOrdered > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {dozensOrdered} dz in cart
              </span>
            )}
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all"
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Added
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Add a Dozen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

type PlatterRow = { id: number; slug: string; dozens: number };
type PlatterDraft = { id: number; rows: PlatterRow[] };

const PLATTER_MINIMUM = 2;

const sumDozens = (rows: PlatterRow[]) =>
  rows.reduce((sum, r) => sum + (Number.isFinite(r.dozens) ? r.dozens : 0), 0);

function PlatterSection() {
  const { addPlatter } = useCart();
  // A unique-id counter shared by platters and their rows.
  const idRef = useRef(1);
  const nextId = () => (idRef.current += 1);

  const [drafts, setDrafts] = useState<PlatterDraft[]>([
    { id: 1, rows: [{ id: nextId(), slug: cookies[0].slug, dozens: 1 }] },
  ]);
  const [added, setAdded] = useState(false);

  const readyDrafts = useMemo(
    () => drafts.filter((d) => sumDozens(d.rows) >= PLATTER_MINIMUM),
    [drafts],
  );

  const updateDraftRows = (
    draftId: number,
    fn: (rows: PlatterRow[]) => PlatterRow[],
  ) =>
    setDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, rows: fn(d.rows) } : d)),
    );

  const updateRow = (draftId: number, rowId: number, patch: Partial<PlatterRow>) =>
    updateDraftRows(draftId, (rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    );

  const addRow = (draftId: number) =>
    updateDraftRows(draftId, (rows) => [
      ...rows,
      { id: nextId(), slug: cookies[0].slug, dozens: 1 },
    ]);

  const removeRow = (draftId: number, rowId: number) =>
    updateDraftRows(draftId, (rows) =>
      rows.length > 1 ? rows.filter((r) => r.id !== rowId) : rows,
    );

  const addDraft = () =>
    setDrafts((prev) => [
      ...prev,
      { id: nextId(), rows: [{ id: nextId(), slug: cookies[0].slug, dozens: 1 }] },
    ]);

  const removeDraft = (draftId: number) =>
    setDrafts((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== draftId) : prev));

  const handleAddPlatters = () => {
    if (readyDrafts.length === 0) return;
    // Each draft that meets the minimum becomes its own platter in the cart.
    for (const draft of readyDrafts) {
      const platterTotals: Record<string, number> = {};
      for (const r of draft.rows) {
        if (r.dozens > 0) platterTotals[r.slug] = (platterTotals[r.slug] ?? 0) + r.dozens;
      }
      addPlatter(platterTotals);
    }
    // Reset the builder so a fresh platter can be started.
    setDrafts([{ id: nextId(), rows: [{ id: nextId(), slug: cookies[0].slug, dozens: 1 }] }]);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mt-24 space-y-8">
      <section className="rounded-3xl bg-card shadow-soft p-8 md:p-12">
        <header className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Build your own</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold text-primary">
            Platters — 2 dozen minimum
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pick your cookies and how many dozens of each. Each platter must total at least two
            dozen — add as many platters as you like.
          </p>
        </header>

        <div className="mt-10 max-w-2xl mx-auto space-y-8">
          {drafts.map((draft, draftIndex) => {
            const total = sumDozens(draft.rows);
            const meetsMinimum = total >= PLATTER_MINIMUM;
            return (
              <div key={draft.id} className="rounded-2xl border border-border bg-background p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Platter {draftIndex + 1}
                  </h3>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDraft(draft.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" /> Remove platter
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {draft.rows.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-end gap-3 sm:flex-nowrap">
                      <label className="flex-1 min-w-[12rem]">
                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Cookie
                        </span>
                        <select
                          value={row.slug}
                          onChange={(e) => updateRow(draft.id, row.id, { slug: e.target.value })}
                          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          {cookies.map((c) => (
                            <option key={c.slug} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="w-28">
                        <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                          Dozens
                        </span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={row.dozens}
                          onChange={(e) =>
                            updateRow(draft.id, row.id, {
                              dozens: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                            })
                          }
                          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeRow(draft.id, row.id)}
                        disabled={draft.rows.length === 1}
                        aria-label="Remove cookie from platter"
                        className="rounded-xl border border-border p-2.5 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => addRow(draft.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add another cookie
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Platter total:{" "}
                    <span className={`font-semibold ${meetsMinimum ? "text-primary" : "text-foreground"}`}>
                      {total} {total === 1 ? "dozen" : "dozens"}
                    </span>
                    {!meetsMinimum && (
                      <span className="text-accent"> — add {PLATTER_MINIMUM - total} more</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addDraft}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            <Plus className="h-4 w-4" /> Add another platter
          </button>

          <div className="flex flex-wrap items-center justify-end gap-4 border-t border-border pt-6 mt-2">
            <button
              type="button"
              onClick={handleAddPlatters}
              disabled={readyDrafts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-warm hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added to cart
                </>
              ) : readyDrafts.length > 1 ? (
                `Add ${readyDrafts.length} platters to cart`
              ) : (
                "Add platter to cart"
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
