"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";

interface MeResponse {
  user: { id: string; email: string; name: string };
}

// Client Component: whether you're logged in is genuinely interactive
// client-side state (it changes without a navigation, e.g. right after
// login/logout), unlike the shop pages which stay Server Components.
export function NavBar() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/api/auth/me"),
    retry: false,
  });

  async function handleLogout() {
    await apiFetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    window.location.href = "/";
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
      <Link href="/" className="font-semibold text-lg tracking-tight">
        Bloom Beauty
      </Link>
      <div className="flex items-center gap-5 text-sm">
        <Link href="/shop">Shop</Link>
        {data?.user ? (
          <>
            <Link href="/cart">Cart</Link>
            <Link href="/orders">Orders</Link>
            <span className="text-neutral-500">{data.user.name}</span>
            <button onClick={handleLogout} className="text-neutral-500 hover:text-black">
              Log out
            </button>
          </>
        ) : !isLoading ? (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/register">Register</Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
