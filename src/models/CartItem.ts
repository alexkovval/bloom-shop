import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface CartItemDocument extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItemDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

// One line per (user, product) pair — mirrors the mobile app's design
// deliberately, so "add to cart" can upsert-by-key atomically instead of
// scanning for an existing line first. See ARCHITECTURE_PLAN.md §3.
cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

// See User.ts for why this is a plain annotation, not a ReturnType cast.
export const CartItem: Model<CartItemDocument> =
  models.CartItem || model<CartItemDocument>("CartItem", cartItemSchema);
