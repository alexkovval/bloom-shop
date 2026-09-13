// Per-product photos (real stock photos, sourced from Unsplash — free license,
// hotlinked directly from images.unsplash.com so no binary assets need to
// live in this repo). Keyed by exact product name, matched against
// `PRODUCTS[].name` in scripts/seed.ts. Distinct from `categoryImages.ts`,
// which is only for the homepage hero/category tiles.
//
// If you add a new seed product, add its photo here too — seed.ts will
// throw at seed time if a product has no entry, rather than silently
// falling back to a shared placeholder.
const UNSPLASH_PARAMS = "w=800&h=800&fit=crop&auto=format&q=80";

export const PRODUCT_IMAGE: Record<string, string> = {
  // Skincare
  "Hydrating Gel Cleanser": `https://images.unsplash.com/photo-1739131285874-8d545cffef95?${UNSPLASH_PARAMS}`,
  "Vitamin C Brightening Serum": `https://images.unsplash.com/photo-1760860992928-221d73c4c0cc?${UNSPLASH_PARAMS}`,
  "Overnight Repair Cream": `https://images.unsplash.com/photo-1638131164559-b05daa4ee8be?${UNSPLASH_PARAMS}`,
  "SPF 50 Daily Sunscreen": `https://images.unsplash.com/photo-1698906821280-34072d3ac1be?${UNSPLASH_PARAMS}`,
  "Exfoliating AHA Toner": `https://images.unsplash.com/photo-1585652757146-e9d00bf2810c?${UNSPLASH_PARAMS}`,
  // Makeup
  "Matte Liquid Lipstick": `https://images.unsplash.com/photo-1518715982419-9015401820ce?${UNSPLASH_PARAMS}`,
  "Weightless Foundation": `https://images.unsplash.com/photo-1695634326782-1f7e0d52eda2?${UNSPLASH_PARAMS}`,
  "Volumizing Mascara": `https://images.unsplash.com/photo-1512207159096-c2c91b1dfadd?${UNSPLASH_PARAMS}`,
  "Eyeshadow Palette — Neutrals": `https://images.unsplash.com/photo-1533562389935-457b1ae48a39?${UNSPLASH_PARAMS}`,
  "Cream Blush Stick": `https://images.unsplash.com/photo-1575686717697-f43bd36e74c2?${UNSPLASH_PARAMS}`,
  // Haircare
  "Repairing Shampoo": `https://images.unsplash.com/photo-1701992678972-d5a053ad0fb0?${UNSPLASH_PARAMS}`,
  "Deep Conditioning Mask": `https://images.unsplash.com/photo-1732861612244-5704d12e9397?${UNSPLASH_PARAMS}`,
  "Heat Protectant Spray": `https://images.unsplash.com/photo-1699982493694-d9ef978318aa?${UNSPLASH_PARAMS}`,
  "Argan Oil Hair Serum": `https://images.unsplash.com/photo-1699373383871-4ca5636948c1?${UNSPLASH_PARAMS}`,
  "Volumizing Dry Shampoo": `https://images.unsplash.com/photo-1701992678962-41703126549c?${UNSPLASH_PARAMS}`,
  // Fragrance
  "Citrus Bloom Eau de Parfum": `https://images.unsplash.com/photo-1709662369957-0cbf9f8452fc?${UNSPLASH_PARAMS}`,
  "Amber & Oud Eau de Parfum": `https://images.unsplash.com/photo-1564644411635-5ec7c9aca726?${UNSPLASH_PARAMS}`,
  "Rose Petal Body Mist": `https://images.unsplash.com/photo-1617537230936-bb8c9327e84f?${UNSPLASH_PARAMS}`,
  "Sandalwood Solid Perfume": `https://images.unsplash.com/photo-1672883435480-81b9f385654e?${UNSPLASH_PARAMS}`,
};
