// Same flat tax/shipping math as the mobile app's backend — ported as-is,
// see ARCHITECTURE_PLAN.md §1. All money is integer cents throughout.
const TAX_RATE = 0.08;
const FLAT_SHIPPING_CENTS = 500;

export interface PricingLineInput {
  priceCents: number;
  quantity: number;
}

export interface PricingResult {
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
}

export function computeTotals(items: PricingLineInput[]): PricingResult {
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const shippingCents = subtotalCents > 0 ? FLAT_SHIPPING_CENTS : 0;
  const totalCents = subtotalCents + taxCents + shippingCents;
  return { subtotalCents, taxCents, shippingCents, totalCents };
}
