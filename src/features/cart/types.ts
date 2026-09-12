export interface CartLineItemData {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    priceCents: number;
    imageUrl: string;
    category: string;
    stock: number;
  };
}

export interface CartData {
  items: CartLineItemData[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
}
