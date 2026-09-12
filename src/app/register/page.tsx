"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { registerSchema, type RegisterInput } from "@/features/auth/validation/authSchemas";
import { ApiError } from "@/lib/apiClient";

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(input: RegisterInput) {
    try {
      await registerUser.mutateAsync(input);
      router.push("/shop");
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
        setError("email", { message: err.message });
      } else {
        setError("root", { message: "Something went wrong. Try again." });
      }
    }
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField label="Name" {...register("name")} error={errors.name?.message} />
        <TextField label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <TextField
          label="Password"
          type="password"
          {...register("password")}
          error={errors.password?.message}
        />
        {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
