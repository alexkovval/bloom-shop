import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface OrderItemSnapshot {
  productId: Types.ObjectId;
  nameSnapshot: string;
  priceSnapshotCents: number;
  quantity: number;
}

export interface ShippingInfo {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderDocument extends Document {
  userId: Types.ObjectId;
  status: "placed";
  items: OrderItemSnapshot[];
  shippingInfo: ShippingInfo;
  cardLast4: string;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

// Embedded, not a separate collection/join — order items are always fetched
// together with the order and never queried independently. See
// ARCHITECTURE_PLAN.md §3.
const orderItemSchema = new Schema<OrderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshotCents: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingInfoSchema = new Schema<ShippingInfo>(
  {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true, default: "placed" },
    items: { type: [orderItemSchema], required: true },
    shippingInfo: { type: shippingInfoSchema, required: true },
    // Only the last 4 digits are ever persisted — see
    // ARCHITECTURE_PLAN.md §1/§4. Full number/expiry never reach the server.
    cardLast4: { type: String, required: true },
    subtotalCents: { type: Number, required: true },
    taxCents: { type: Number, required: true },
    shippingCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    // MongoDB's equivalent of the Postgres unique constraint that makes the
    // idempotency guard actually hold under a race — see
    // ARCHITECTURE_PLAN.md §4. Non-negotiable.
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });

// See User.ts for why this is a plain annotation, not a ReturnType cast.
export const Order: Model<OrderDocument> =
  models.Order || model<OrderDocument>("Order", orderSchema);
