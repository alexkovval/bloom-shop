import { z } from "zod";
import { isValidLuhn } from "@/lib/luhn";

export const shippingSchema = z.object({
  fullName: z.string().min(1, "Required"),
  addressLine1: z.string().min(1, "Required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  postalCode: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
});

// Manual entry only — no scan/camera flow in the web version (your call).
// Full number + expiry are validated here and never leave the browser;
// only the last 4 digits are sent to the server. See
// ARCHITECTURE_PLAN.md §1.
export const cardSchema = z.object({
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{12,19}$/.test(v), "Enter a valid card number")
    .refine(isValidLuhn, "Card number is invalid"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY")
    .refine((v) => {
      const [month, year] = v.split("/").map(Number);
      // First moment of the month AFTER expiry — a card expiring 12/28 is
      // still valid through the end of December 2028.
      const expiresAt = new Date(2000 + year, month);
      return expiresAt.getTime() > Date.now();
    }, "Card has expired"),
});

export const checkoutSchema = shippingSchema.merge(cardSchema);
export type CheckoutInput = z.infer<typeof checkoutSchema>;
