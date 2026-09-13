"use client";

import { useRouter } from "next/navigation";

// Client Component: `router.back()` needs the browser history, which a
// Server Component can't touch. Deliberately goes back rather than linking
// to a fixed `/shop` — that preserves whatever search/category filters (or
// page) the visitor came from instead of resetting them.
export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-black self-start"
    >
      <span aria-hidden>←</span> Back
    </button>
  );
}
