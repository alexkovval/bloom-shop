import Image from "next/image";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { getProductById } from "@/lib/queries";
import { AddToCartButton } from "@/components/AddToCartButton";
import { BackButton } from "@/components/BackButton";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

// Server Component, same direct-fetch pattern as /shop — see
// ARCHITECTURE_PLAN.md §1. Only the "Add to cart" button needs client
// interactivity, so it's the one piece pulled out into its own
// Client Component rather than making this whole page one.
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-6">
      <BackButton />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
          <Image src={product.imageUrl} alt={product.name} fill sizes="50vw" className="object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <span className="text-xs uppercase tracking-wide text-neutral-500">{product.category}</span>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-xl">${(product.priceCents / 100).toFixed(2)}</p>
          <p className="text-neutral-600">{product.description}</p>
          <p className="text-sm text-neutral-500">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>
          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </main>
  );
}
