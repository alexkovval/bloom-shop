// Rendered instantly by Next.js the moment you click a category chip, the
// search box, or a pagination link — while the Server Component above
// (which awaits a MongoDB query) is still fetching. Without this file the
// click just sits there with no feedback until the whole page swaps in.
// Shape mirrors the real /shop layout so nothing jumps once data arrives.
export default function ShopLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-24 rounded bg-neutral-200" />
      <div className="h-10 w-full max-w-sm rounded-md bg-neutral-200" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-full bg-neutral-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-lg border border-neutral-200 overflow-hidden">
            <div className="aspect-square bg-neutral-200" />
            <div className="p-3 flex flex-col gap-2">
              <div className="h-3 w-1/3 rounded bg-neutral-200" />
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
              <div className="h-4 w-1/4 rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
