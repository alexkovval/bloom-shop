import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import type { RegisterInput } from "../validation/authSchemas";

interface AuthResponse {
  user: { id: string; email: string; name: string };
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
    },
  });
}
