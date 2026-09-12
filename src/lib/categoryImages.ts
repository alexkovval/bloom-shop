import type { Category } from "@/models/Product";

// Shared between the seed script (assigns these to products) and the
// homepage banner (uses them for the category tiles) so the two can't
// drift apart into referencing different files.
export const CATEGORY_IMAGE: Record<Category, string> = {
  Skincare: "/images/skincare.jpg",
  Makeup: "/images/makeup.jpg",
  Haircare: "/images/haircare.jpg",
  Fragrance: "/images/fragrance.jpg",
};
