import { Link, Outlet } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { CartProvider } from "@/hooks/use-cart";

const nav = [
  { to: "/", label: "Home" },
  { to: "/cookies", label: "Cookies" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Cart" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-soft transition-transform group-hover:rotate-12">
            <Cookie className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-primary">
            bakedbyjojo
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground rounded-full transition-colors"
              activeOptions={{ exact: n.to === "/" }}
              activeProps={{ className: "px-4 py-2 text-sm font-medium rounded-full bg-secondary text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-accent" />
            <span className="font-display text-lg font-semibold text-primary">bakedbyjojo</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Small-batch homemade cookies, baked with love and shipped statewide.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Visit</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Statewide Shipping<br />
            Local Pickup:<br />
            Mon–Fri 5pm–8pm & Sat–Sun 1pm–7pm
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-primary">Get in touch</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            bakedbyjojo124@gmail.com<br />
            914-419-0765
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} bakedbyjojo. Baked with love.
      </div>
    </footer>
  );
}

export function SiteLayout() {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1"><Outlet /></main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
