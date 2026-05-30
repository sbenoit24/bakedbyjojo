import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "bakedbyjojo-cart";

// slug -> number of dozens ordered
export type CartItems = Record<string, number>;

// The cart keeps à-la-carte cookie dozens separate from platter orders so the
// order page can show them as distinct kinds of order. Each platter is its own
// map of slug -> dozens, so a customer can build several separate platters.
type CartState = {
  cookies: CartItems;
  platters: CartItems[];
};

const emptyState: CartState = { cookies: {}, platters: [] };

type CartContextValue = {
  cookieItems: CartItems;
  platters: CartItems[];
  // À-la-carte cookie order
  addDozen: (slug: string) => void;
  setDozens: (slug: string, dozens: number) => void;
  removeItem: (slug: string) => void;
  // Platter orders — each platter is addressed by its index in `platters`.
  addPlatter: (rows: CartItems) => void;
  setPlatterDozens: (index: number, slug: string, dozens: number) => void;
  removePlatterItem: (index: number, slug: string) => void;
  removePlatter: (index: number) => void;
  clearPlatters: () => void;
  clear: () => void;
  cookieDozens: number;
  platterDozens: number;
  totalDozens: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const sumDozens = (items: CartItems) =>
  Object.values(items).reduce((sum, n) => sum + n, 0);

// Add `dozens` for `slug` to a map, dropping the entry when it reaches zero.
const adjust = (items: CartItems, slug: string, dozens: number): CartItems => {
  if (dozens <= 0) {
    const { [slug]: _removed, ...rest } = items;
    return rest;
  }
  return { ...items, [slug]: dozens };
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>(emptyState);

  // Load any previously saved order once we're on the client.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.platters)) {
          // Current shape: a list of platters.
          setState({ cookies: parsed.cookies ?? {}, platters: parsed.platters });
        } else if ("cookies" in parsed || "platter" in parsed) {
          // Older shape: a single combined platter map -> wrap into the list.
          const platter: CartItems = parsed.platter ?? {};
          setState({
            cookies: parsed.cookies ?? {},
            platters: Object.keys(platter).length > 0 ? [platter] : [],
          });
        } else {
          // Oldest flat shape (slug -> dozens) -> treat as the cookies bucket.
          setState({ cookies: parsed, platters: [] });
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist the order so it survives a page reload.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage failures (e.g. private mode)
    }
  }, [state]);

  const addDozen = (slug: string) =>
    setState((prev) => ({ ...prev, cookies: adjust(prev.cookies, slug, (prev.cookies[slug] ?? 0) + 1) }));

  const setDozens = (slug: string, dozens: number) =>
    setState((prev) => ({ ...prev, cookies: adjust(prev.cookies, slug, dozens) }));

  const removeItem = (slug: string) =>
    setState((prev) => ({ ...prev, cookies: adjust(prev.cookies, slug, 0) }));

  // Append the built rows as a brand-new platter (so each "Add platter" is
  // kept as its own order rather than merged into one).
  const addPlatter = (rows: CartItems) =>
    setState((prev) => {
      const platter: CartItems = {};
      for (const [slug, dozens] of Object.entries(rows)) {
        if (dozens > 0) platter[slug] = (platter[slug] ?? 0) + dozens;
      }
      if (Object.keys(platter).length === 0) return prev;
      return { ...prev, platters: [...prev.platters, platter] };
    });

  // Adjust one cookie within a single platter, dropping the platter entirely
  // once it has no cookies left.
  const setPlatterDozens = (index: number, slug: string, dozens: number) =>
    setState((prev) => ({
      ...prev,
      platters: prev.platters
        .map((p, i) => (i === index ? adjust(p, slug, dozens) : p))
        .filter((p) => Object.keys(p).length > 0),
    }));

  const removePlatterItem = (index: number, slug: string) =>
    setPlatterDozens(index, slug, 0);

  const removePlatter = (index: number) =>
    setState((prev) => ({ ...prev, platters: prev.platters.filter((_, i) => i !== index) }));

  const clearPlatters = () => setState((prev) => ({ ...prev, platters: [] }));

  const clear = () => setState(emptyState);

  const cookieDozens = sumDozens(state.cookies);
  const platterDozens = state.platters.reduce((sum, p) => sum + sumDozens(p), 0);

  return (
    <CartContext.Provider
      value={{
        cookieItems: state.cookies,
        platters: state.platters,
        addDozen,
        setDozens,
        removeItem,
        addPlatter,
        setPlatterDozens,
        removePlatterItem,
        removePlatter,
        clearPlatters,
        clear,
        cookieDozens,
        platterDozens,
        totalDozens: cookieDozens + platterDozens,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
