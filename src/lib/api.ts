import { requireAdmin, unauthorized, AuthError } from "@/lib/auth";

export async function guard(): Promise<Awaited<ReturnType<typeof requireAdmin>> | Response> {
  try {
    return await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return unauthorized();
    throw e;
  }
}

export function isResponse(x: unknown): x is Response {
  return x instanceof Response;
}

export function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/// Spec rows arrive either as an array or as a newline-separated textarea value.
export function specList(value: unknown): string[] {
  const rows = Array.isArray(value) ? value : String(value ?? "").split(/\r?\n/);
  return rows.map((r) => String(r).trim()).filter(Boolean).slice(0, 20);
}
