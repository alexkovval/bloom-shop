interface SearchBarProps {
  defaultValue?: string;
  category?: string;
}

// A plain GET form, no client JS: submitting re-navigates to /shop?search=...
// (preserving ?category= via a hidden field), which is what keeps the shop
// page server-rendered end to end.
export function SearchBar({ defaultValue, category }: SearchBarProps) {
  return (
    <form action="/shop" method="GET" className="flex gap-2">
      {category ? <input type="hidden" name="category" value={category} /> : null}
      <input
        type="search"
        name="search"
        defaultValue={defaultValue}
        placeholder="Search products…"
        className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
      />
      <button
        type="submit"
        className="rounded-md bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-700"
      >
        Search
      </button>
    </form>
  );
}
