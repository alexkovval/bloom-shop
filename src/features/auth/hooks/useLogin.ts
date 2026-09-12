import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { LoginInput } from "../validation/authSchemas";

interface AuthResponse {
  user: { id: string; email: string; name: string };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
    },
  });
}
