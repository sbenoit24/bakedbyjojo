import chocolateChip from "@/assets/choconut.jpg";
import sugar from "@/assets/almond.jpg";
import oatmeal from "@/assets/oatmealraisin.jpg";
import snickerdoodle from "@/assets/graham.jpg";
import peanutButter from "@/assets/mintymocha.jpg";
import doubleChocolate from "@/assets/figgies.jpg";

export type Cookie = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
};

export const cookies: Cookie[] = [
  {
    slug: "classic-chocolate-chip",
    name: "Classic Chocolate Chip",
    tagline: "The one that started it all",
    description:
      "Brown butter, Madagascar vanilla, and pools of semi-sweet chocolate. Crisp edges, gooey center.",
    price: 24,
    image: chocolateChip,
    badge: "Bestseller",
  },
  {
    slug: "frosted-sugar",
    name: "Frosted Sugar Cookies",
    tagline: "A little party in every bite",
    description:
      "Tender, buttery sugar cookies hand-finished with vanilla bean royal icing. Perfect for celebrations.",
    price: 28,
    image: sugar,
  },
  {
    slug: "oatmeal-raisin",
    name: "Oatmeal Raisin",
    tagline: "Grandma-approved",
    description:
      "Hearty rolled oats, plump raisins, a whisper of cinnamon. Chewy, wholesome, irresistible.",
    price: 22,
    image: oatmeal,
  },
  {
    slug: "snickerdoodle",
    name: "Cinnamon Snickerdoodle",
    tagline: "Cozy in cookie form",
    description:
      "Rolled in cinnamon sugar, baked until pillowy. Tastes like a sweater and a fireplace.",
    price: 22,
    image: snickerdoodle,
  },
  {
    slug: "peanut-butter",
    name: "Peanut Butter",
    tagline: "Crisscrossed and classic",
    description:
      "Rich roasted peanut butter and a touch of brown sugar. Iconic fork pattern, melt-in-your-mouth texture.",
    price: 24,
    image: peanutButter,
  },
  {
    slug: "double-chocolate",
    name: "Double Chocolate",
    tagline: "For the serious chocoholic",
    description:
      "Dutch cocoa dough loaded with dark chocolate chunks. Fudgy, decadent, unapologetic.",
    price: 26,
    image: doubleChocolate,
    badge: "Fan favorite",
  },
];
