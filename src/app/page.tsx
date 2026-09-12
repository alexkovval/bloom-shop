import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { CATEGORIES } from "@/models/Product";
import { CATEGORY_IMAGE } from "@/lib/categoryImages";

export default function Home() {
  return (
    <main className="flex flex-col">
      <section className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
        <Image
          src={CATEGORY_IMAGE.Skincare}
          alt="Bloom Beauty products"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 gap-5">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white">
            Bloom Beauty
          </h1>
          <p className="text-white/90 max-w-md text-lg">
            Skincare, makeup, haircare &amp; fragrance — thoughtfully picked, simply priced.
          </p>
          <Link href="/shop">
            <Button className="text-base px-6 py-3">Shop now</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl w-full px-6 py-16">
        <h2 className="text-xl font-semibold mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/shop?category=${category}`}
              className="group relative aspect-square rounded-lg overflow-hidden"
            >
              <Image
                src={CATEGORY_IMAGE[category]}
                alt={category}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition" />
              <span className="absolute bottom-3 left-3 text-white font-medium">{category}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
