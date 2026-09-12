import Link from "next/link";

interface CategoryChipRowProps {
  categories: readonly string[];
  activeCategory?: string;
  search?: string;
}

// Plain links, not client-side state — the active filter lives in the URL
// (?category=), which is what lets /shop stay a Server Component that
// re-fetches on navigation instead of needing client JS to filter.
export function CategoryChipRow({ categories, activeCategory, search }: CategoryChipRowProps) {
  function hrefFor(category?: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(undefined)}
        className={`rounded-full px-4 py-2 text-sm border ${
          !activeCategory ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-300"
        }`}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={hrefFor(category)}
          className={`rounded-full px-4 py-2 text-sm border ${
            activeCategory === category
              ? "bg-neutral-900 text-white border-neutral-900"
              : "border-neutral-300"
          }`}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
