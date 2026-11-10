import type { Prisma } from "@prisma/client";

export function parsePortalInput(body: unknown): Partial<Prisma.PortalLinkCreateInput> | Response {
  const invalid = (error: string) => Response.json({ error }, { status: 400 });
  if (!body || typeof body !== "object" || Array.isArray(body)) return invalid("Data portal tidak valid");
  const input = body as Record<string, unknown>;
  const data: Partial<Prisma.PortalLinkCreateInput> = {};
  for (const key of ["title", "description", "tag", "youtubeChannelId", "imageAlt"] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (value === null && ["tag", "youtubeChannelId", "imageAlt"].includes(key)) {
      Object.assign(data, { [key]: null });
      continue;
    }
    if (typeof value !== "string") return invalid("Teks portal tidak valid");
    const text = value.trim();
    if (key === "title" && !text) return invalid("Judul wajib diisi");
    if (key === "imageAlt" && text.length > 300) return invalid("Teks alternatif maksimal 300 karakter");
    data[key] = text;
  }
  for (const key of ["image", "url"] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (value === null || value === "") {
      data[key] = key === "image" ? "" : null;
      continue;
    }
    if (typeof value !== "string" || value.length > 2048) return invalid("URL tidak valid");
    const url = value.trim();
    const localImage = key === "image" && /^\/(?:images|uploads)\/[a-zA-Z0-9_./-]+$/.test(url) && !url.split("/").includes("..");
    if (!localImage) {
      try {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) return invalid("URL harus menggunakan http atau https");
      } catch {
        return invalid("URL tidak valid");
      }
    }
    data[key] = url;
  }
  if ("status" in input) {
    if (input.status !== "ONLINE" && input.status !== "SEGERA HADIR") return invalid("Status portal tidak valid");
    data.status = input.status;
  }
  for (const key of ["number", "order"] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < (key === "number" ? 1 : 0) || value > 2147483647) {
      return invalid("Nomor dan urutan harus berupa bilangan bulat yang valid");
    }
    data[key] = value;
  }
  for (const key of ["dark", "published"] as const) {
    if (!(key in input)) continue;
    if (typeof input[key] !== "boolean") return invalid("Pilihan tampilan tidak valid");
    data[key] = input[key];
  }
  return data;
}
