import { Schema, model, models, type Document } from "mongoose";

// Deliberately not a 1:1 port of the Postgres schema — see
// ARCHITECTURE_PLAN.md §3. Prices are integer cents throughout.
export const CATEGORIES = ["Skincare", "Makeup", "Haircare", "Fragrance"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ProductDocument extends Document {
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  category: Category;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priceCents: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true, enum: CATEGORIES },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

// Text index powers `?search=` (replaces the Postgres ILIKE query).
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1 });

export const Product =
  (models.Product as ReturnType<typeof model<ProductDocument>>) ||
  model<ProductDocument>("Product", productSchema);
