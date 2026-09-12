// Thin fetch wrapper for Client Components talking to our own /api/* Route
// Handlers. Same-origin, so the session cookie rides along automatically —
// `credentials: "include"` is what makes that explicit rather than relying
// on browser defaults. Normalizes every failure into ApiError so hooks
// don't each re-implement "was this a 401 vs a validation error" parsing.
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server. Check your connection.");
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // No/invalid JSON body (e.g. a 204) — fine for a success response.
  }

  if (!res.ok) {
    const errorBody = (json as { error?: { code?: string; message?: string; details?: unknown } })
      ?.error;
    throw new ApiError(
      res.status,
      errorBody?.code ?? "UNKNOWN_ERROR",
      errorBody?.message ?? "Something went wrong",
      errorBody?.details
    );
  }

  return json as T;
}
