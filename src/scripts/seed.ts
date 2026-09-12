// Standalone script (run via `npm run seed`, i.e. `tsx src/scripts/seed.ts`)
// — outside `next dev`/`next build`, Next.js doesn't load .env for us, so
// this loads it explicitly via dotenv.
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { Product, CATEGORIES, type Category } from "../models/Product";
import { CATEGORY_IMAGE } from "../lib/categoryImages";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI env var — copy .env.example to .env and fill it in");
}

// Photos live in public/images/ and are served by Next automatically — no
// hand-written static route needed, unlike the mobile app's Express backend.
// (Category → filename mapping now lives in lib/categoryImages.ts, shared
// with the homepage banner.)

const PRODUCTS: Array<{
  name: string;
  description: string;
  priceCents: number;
  category: Category;
  stock: number;
}> = [
  // Skincare
  {
    name: "Hydrating Gel Cleanser",
    description: "A gentle, sulfate-free cleanser that leaves skin soft without stripping moisture.",
    priceCents: 1800,
    category: "Skincare",
    stock: 40,
  },
  {
    name: "Vitamin C Brightening Serum",
    description: "10% vitamin C serum to even tone and add radiance.",
    priceCents: 3200,
    category: "Skincare",
    stock: 25,
  },
  {
    name: "Overnight Repair Cream",
    description: "Rich night cream with ceramides and peptides for overnight recovery.",
    priceCents: 4200,
    category: "Skincare",
    stock: 18,
  },
  {
    name: "SPF 50 Daily Sunscreen",
    description: "Lightweight, non-greasy broad-spectrum sunscreen for everyday wear.",
    priceCents: 2400,
    category: "Skincare",
    stock: 35,
  },
  {
    name: "Exfoliating AHA Toner",
    description: "A gentle glycolic acid toner that smooths texture with regular use.",
    priceCents: 2100,
    category: "Skincare",
    stock: 30,
  },
  // Makeup
  {
    name: "Matte Liquid Lipstick",
    description: "Long-wearing, transfer-resistant matte lipstick in a universal red.",
    priceCents: 1600,
    category: "Makeup",
    stock: 50,
  },
  {
    name: "Weightless Foundation",
    description: "Buildable medium coverage foundation with a natural satin finish.",
    priceCents: 3400,
    category: "Makeup",
    stock: 22,
  },
  {
    name: "Volumizing Mascara",
    description: "Fiber-infused mascara for dramatic length and volume without clumping.",
    priceCents: 1900,
    category: "Makeup",
    stock: 45,
  },
  {
    name: "Eyeshadow Palette — Neutrals",
    description: "12-shade matte and shimmer palette in wearable neutral tones.",
    priceCents: 3800,
    category: "Makeup",
    stock: 20,
  },
  {
    name: "Cream Blush Stick",
    description: "A blendable cream blush that melts into skin for a natural flush.",
    priceCents: 1700,
    category: "Makeup",
    stock: 38,
  },
  // Haircare
  {
    name: "Repairing Shampoo",
    description: "Sulfate-free shampoo formulated for damaged, color-treated hair.",
    priceCents: 2200,
    category: "Haircare",
    stock: 30,
  },
  {
    name: "Deep Conditioning Mask",
    description: "Weekly treatment mask that restores softness to dry, brittle hair.",
    priceCents: 2600,
    category: "Haircare",
    stock: 24,
  },
  {
    name: "Heat Protectant Spray",
    description: "Lightweight spray that shields hair from heat styling up to 450°F.",
    priceCents: 1900,
    category: "Haircare",
    stock: 28,
  },
  {
    name: "Argan Oil Hair Serum",
    description: "A few drops tame frizz and add shine without weighing hair down.",
    priceCents: 2400,
    category: "Haircare",
    stock: 26,
  },
  {
    name: "Volumizing Dry Shampoo",
    description: "Refreshes roots and adds texture between washes.",
    priceCents: 1500,
    category: "Haircare",
    stock: 40,
  },
  // Fragrance
  {
    name: "Citrus Bloom Eau de Parfum",
    description: "A bright, fresh scent with notes of bergamot, neroli, and white musk.",
    priceCents: 5800,
    category: "Fragrance",
    stock: 15,
  },
  {
    name: "Amber & Oud Eau de Parfum",
    description: "A warm, layered scent built around amber, oud, and vanilla.",
    priceCents: 6400,
    category: "Fragrance",
    stock: 12,
  },
  {
    name: "Rose Petal Body Mist",
    description: "A light, everyday body mist with soft rose and peony notes.",
    priceCents: 2200,
    category: "Fragrance",
    stock: 32,
  },
  {
    name: "Sandalwood Solid Perfume",
    description: "A travel-friendly solid perfume balm with a warm sandalwood base.",
    priceCents: 1800,
    category: "Fragrance",
    stock: 20,
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI as string);
  console.log("Connected to MongoDB");

  for (const p of PRODUCTS) {
    await Product.updateOne(
      { name: p.name },
      { $set: { ...p, imageUrl: CATEGORY_IMAGE[p.category] } },
      { upsert: true }
    );
  }
  console.log(`Seeded/updated ${PRODUCTS.length} products across ${CATEGORIES.length} categories`);

  const demoEmail = "demo@bloombeauty.dev";
  const demoPassword = "password123";
  const existing = await User.findOne({ email: demoEmail });
  if (!existing) {
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    await User.create({ email: demoEmail, passwordHash, name: "Demo User" });
    console.log(`Created demo user: ${demoEmail} / ${demoPassword}`);
  } else {
    console.log("Demo user already exists, skipping");
  }

  await mongoose.disconnect();
  console.log("Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
