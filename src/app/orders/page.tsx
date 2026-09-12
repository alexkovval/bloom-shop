import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, UnauthorizedError } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/queries";

// Server Component — pure data display, no interactivity needed, so no
// reason to ship client JS for this page. middleware.ts already redirects
// unauthenticated requests away before they get here; requireUser() is the
// real check (see its own comment on why middleware alone isn't enough).
export default async function OrdersPage() {
  let userId: string;
  try {
    const user = await requireUser();
    userId = user.id;
  } catch (err) {
    if (err instanceof UnauthorizedError) redirect("/login?redirectTo=/orders");
    throw err;
  }

  const orders = await listOrdersForUser(userId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Your orders</h1>
      {orders.length === 0 ? (
        <p className="text-neutral-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex justify-between items-center rounded-lg border border-neutral-200 px-4 py-3 hover:shadow-sm transition"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">Order #{order.id.slice(-6)}</span>
                <span className="text-xs text-neutral-500">
                  {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                  {order.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <span className="text-sm font-medium">${(order.totalCents / 100).toFixed(2)}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
