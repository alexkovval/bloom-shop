import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import mongoose from "mongoose";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { getOrderForUser } from "@/lib/queries";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

// Server Component. Snapshot line items (nameSnapshot/priceSnapshotCents,
// embedded on the Order document — see ARCHITECTURE_PLAN.md §3) mean this
// page shows exactly what the customer paid, even if the underlying
// product's price or name changes later.
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login?redirectTo=/orders");
    throw err;
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  const order = await getOrderForUser(userId, id);
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/orders" className="text-sm text-neutral-500 hover:underline">
        ← Back to orders
      </Link>
      <h1 className="text-2xl font-semibold mt-2 mb-1">Order #{order.id.slice(-6)}</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Placed {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {order.items.map((item, i) => (
          <div key={`${item.productId}-${i}`} className="flex items-center gap-3 text-sm">
            {/* Current product photo, not a price/name-style snapshot — see
                attachProductImages in lib/queries.ts. */}
            <div className="relative h-12 w-12 shrink-0 rounded-md bg-neutral-100 overflow-hidden">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
              ) : null}
            </div>
            <span className="flex-1">
              {item.name} × {item.quantity}
            </span>
            <span>${((item.priceCents * item.quantity) / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="flex-col gap-2 text-sm border-t border-neutral-200 pt-4 mb-6">
        <div className="flex justify-between">
          <span className="text-neutral-500">Subtotal</span>
          <span>${(order.subtotalCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Tax</span>
          <span>${(order.taxCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Shipping</span>
          <span>${(order.shippingCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t border-neutral-200">
          <span>Total</span>
          <span>${(order.totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="text-sm text-neutral-500 flex flex-col gap-1">
        <p className="font-medium text-neutral-700">Shipping to</p>
        <p>{order.shippingInfo.fullName}</p>
        <p>{order.shippingInfo.addressLine1}</p>
        {order.shippingInfo.addressLine2 ? <p>{order.shippingInfo.addressLine2}</p> : null}
        <p>
          {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.postalCode}
        </p>
        <p>{order.shippingInfo.country}</p>
        <p className="mt-2">Card ending in {order.cardLast4}</p>
      </div>
    </main>
  );
}
