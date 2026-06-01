import chocolateChip from "@/assets/choconut.webp";
import sugar from "@/assets/almond.webp";
import oatmeal from "@/assets/oatmealraisin.webp";
import snickerdoodle from "@/assets/graham.webp";
import peanutButter from "@/assets/mintymocha.webp";
import doubleChocolate from "@/assets/figgies.webp";

export type Cookie = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  ingredients: string;
  allergens: string;
  price: number;
  image: string;
  badge?: string;
  // Stripe Price ID (one dozen) used by Stripe Checkout. The real price lives in
  // Stripe — the cart only ever sends this ID + a quantity, never a dollar
  // amount, so a customer can't tamper with what they're charged. Create one
  // recurring-off Price per cookie in the Stripe Dashboard (Products → Add price)
  // and paste its `price_…` ID here. Until these are real IDs, Checkout will
  // return an error from Stripe.
  stripePriceId: string;
};

export const cookies: Cookie[] = [
  {
    slug: "classic-chocolate-chip",
    name: "Figgie's Favorites (Brownie P.B. Chip)",
    tagline: "The one that started it all",
    description:
      "Dutch cocoa dough loaded with dark chocolate chunks. Fudgy, decadent, unapologetic.",
    ingredients:
      "Sugar, wheat flour, cocoa powder, semi-sweet, bittersweet, peanut butter & milk chocolate chips, butter, whole milk, eggs, vanilla extract, baking soda, and a pinch of salt.",
    allergens: "Contains: wheat, dairy, eggs, soy, and peanuts. May contain tree nuts.",
    price: 13,
    image: doubleChocolate,
    badge: "Fan favorite",
    stripePriceId: "price_1TdaL8RRYxXC5vq1TupNQgRM",
  },
  {
    slug: "frosted-sugar",
    name: "Almond Confetti Cookie",
    tagline: "A little party in every bite",
    description:
      "Tender, buttery sugar cookies hand-finished with vanilla bean royal icing. Perfect for celebrations.",
    ingredients:
      "Cookie: flour, sugar, whole milk, eggs, baking powder, vegetable oil, almond extract. Glaze: powdered sugar, almond extract, water, sprinkles.",
    allergens: "Contains: wheat/gluten, dairy, eggs, and tree nuts (almonds).",
    price: 13,
    image: sugar,
    stripePriceId: "price_1TdaLZRRYxXC5vq1JXMjpbQ5",
  },
  {
    slug: "oatmeal-raisin",
    name: "Oatmeal Raisin",
    tagline: "Grandma-approved",
    description:
      "Hearty rolled oats, plump raisins, a whisper of cinnamon. Chewy, wholesome, irresistible.",
    ingredients:
      "Butter, granulated sugar, brown sugar, eggs, vanilla extract, flour, baking soda, oatmeal, raisins, cinnamon.",
    allergens: "Contains: wheat, eggs, dairy.",
    price: 13,
    image: oatmeal,
    stripePriceId: "price_1TdaLyRRYxXC5vq1Zsd0nkla",
  },
  {
    slug: "snickerdoodle",
    name: "CinnaGraham Chipsters",
    tagline: "Cozy in cookie form",
    description:
      "Rolled in cinnamon sugar, baked until pillowy. Tastes like a sweater and a fireplace.",
    ingredients:
      "Butter, sugar, honey, brown sugar, eggs, vanilla extract, flour, baking soda, cinnamon, graham cracker crumbs, semi-sweet chocolate chips.",
    allergens: "Contains: wheat, eggs, dairy, soy, and honey.",
    price: 13,
    image: snickerdoodle,
    stripePriceId: "price_1TdaMLRRYxXC5vq1yWpU1UaN",
  },
  {
    slug: "peanut-butter",
    name: "Minty Mocha Chipsters",
    tagline: "Crisscrossed and classic",
    description:
      "Rich roasted peanut butter and a touch of brown sugar. Iconic fork pattern, melt-in-your-mouth texture.",
    ingredients:
      "Butter, sugar, dark brown sugar, eggs, vanilla extract, peppermint extract, flour, cocoa powder, baking soda, espresso powder, semi-sweet chocolate chips, crushed peppermint candies.",
    allergens: "Contains: wheat, eggs, dairy, soy. May contain traces of tree nuts.",
    price: 13,
    image: peanutButter,
    stripePriceId: "price_1TdaMhRRYxXC5vq1RUanF7xI",
  },
  {
    slug: "double-chocolate",
    name: "ChocoNut Craze",
    tagline: "For the serious chocoholic",
    description:
      "Brown butter, Madagascar vanilla, and pools of semi-sweet chocolate. Crisp edges, gooey center.",
    ingredients:
      "Butter, Nutella, sugar, brown sugar, eggs, vanilla extract, flour, baking soda, hazelnuts, semi-sweet chocolate chips.",
    allergens: "Contains: tree nuts (hazelnuts), wheat, eggs, dairy, soy.",
    price: 13,
    image: chocolateChip,
    badge: "Bestseller",
    stripePriceId: "price_1TdaN4RRYxXC5vq1x2Raiiyu",
  },
];
