import Link from "next/link";
import Image from "next/image";

export interface ProductCardData {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition"
    >
      <div className="relative aspect-square bg-neutral-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-neutral-500">{product.category}</span>
        <span className="text-sm font-medium group-hover:underline">{product.name}</span>
        <span className="text-sm text-neutral-700">${(product.priceCents / 100).toFixed(2)}</span>
        {product.stock === 0 ? (
          <span className="text-xs text-red-600">Out of stock</span>
        ) : null}
      </div>
    </Link>
  );
}
