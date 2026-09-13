// Same idea as shop/loading.tsx — shown the instant a product card is
// clicked, while the Server Component above awaits getProductById().
// Mirrors the real layout (including the back button row) so there's no
// layout shift on arrival.
export default function ProductLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-6 animate-pulse">
      <div className="h-5 w-16 rounded bg-neutral-200" />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-neutral-200 rounded-lg" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-20 rounded bg-neutral-200" />
          <div className="h-7 w-2/3 rounded bg-neutral-200" />
          <div className="h-6 w-16 rounded bg-neutral-200" />
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-5/6 rounded bg-neutral-200" />
          <div className="h-10 w-32 rounded-md bg-neutral-200 mt-2" />
        </div>
      </div>
    </main>
  );
}
