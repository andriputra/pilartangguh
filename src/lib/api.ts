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
