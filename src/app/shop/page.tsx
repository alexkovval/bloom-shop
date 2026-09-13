import Link from "next/link";
import { CATEGORIES } from "@/models/Product";
import { listProducts } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { CategoryChipRow } from "@/components/CategoryChipRow";
import { SearchBar } from "@/components/SearchBar";

interface ShopPageProps {
  searchParams: Promise<{ search?: string; category?: string; page?: string }>;
}

// Server Component: fetches straight from MongoDB and streams HTML — no
// client-side loading spinner on first paint, and the product grid is
// actually present in the initial response (real SEO for a storefront).
// See ARCHITECTURE_PLAN.md §1.
export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { search, category, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const limit = 12;

  const { items: products, totalPages } = await listProducts({ search, category, page, limit });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Shop</h1>
      <SearchBar defaultValue={search} category={category} />
      <CategoryChipRow categories={CATEGORIES} activeCategory={category} search={search} />

      {products.length === 0 ? (
        <p className="text-neutral-500 py-12 text-center">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex gap-2 justify-center pt-4 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (category) params.set("category", category);
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/shop?${params.toString()}`}
                className={`px-3 py-1 rounded-md border ${
                  p === page ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
