import Link from "next/link";

// Static mockup contact info — this is a portfolio demo, not a real
// storefront, so there's no real support inbox/phone line behind these.
// PROJECT_LAUNCHED is a fixed date (when this rebuild was actually built),
// not `new Date()` — a footer "creation date" should stay put, not read
// today's date on every render.
const PROJECT_LAUNCHED = "September 2026";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-12">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-lg tracking-tight">Bloom Beauty</span>
          <p className="text-sm text-neutral-500">
            Skincare, makeup, haircare, and fragrance — a small store built to actually work end to
            end.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-neutral-900">Contact us</span>
          <a href="mailto:hello@bloombeauty.dev" className="text-neutral-500 hover:text-black">
            hello@bloombeauty.dev
          </a>
          <a href="tel:+97235550123" className="text-neutral-500 hover:text-black">
            +972 3-555-0123
          </a>
          <span className="text-neutral-500">16 Rothschild Blvd, Tel Aviv, Israel</span>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-neutral-900">Shop</span>
          <Link href="/shop" className="text-neutral-500 hover:text-black">
            All products
          </Link>
          <Link href="/orders" className="text-neutral-500 hover:text-black">
            Order history
          </Link>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-6 py-4 text-xs text-neutral-400 text-center">
        © {new Date().getFullYear()} Bloom Beauty · Built by Alexandra Andrusyshyn — Software
        Developer · {PROJECT_LAUNCHED} · Demo project, not a real store
      </div>
    </footer>
  );
}
