"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { loginSchema, type LoginInput } from "@/features/auth/validation/authSchemas";
import { ApiError } from "@/lib/apiClient";

// useSearchParams() (for ?redirectTo=) opts this page out of static
// rendering unless it's wrapped in Suspense — Next.js errors at build time
// otherwise. The page export below just supplies that boundary.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(input: LoginInput) {
    try {
      await login.mutateAsync(input);
      router.push(searchParams.get("redirectTo") ?? "/shop");
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_CREDENTIALS") {
        setError("password", { message: err.message });
      } else {
        setError("root", { message: "Something went wrong. Try again." });
      }
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">Log in</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <TextField
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
        {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-neutral-500">
        No account?{" "}
        <Link href="/register" className="underline">
          Register
        </Link>
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        Demo account: demo@bloombeauty.dev / password123
      </p>
    </main>
  );
}
