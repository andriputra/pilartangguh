import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTENT, DEFAULT_SETTINGS, type SectionData, type SectionKey } from "@/lib/content";

export async function getSections() {
  const rows = await prisma.siteContent.findMany();
  const map = {} as SectionData;
  for (const key of Object.keys(DEFAULT_CONTENT) as SectionKey[]) {
    (map as any)[key] = DEFAULT_CONTENT[key];
  }
  for (const row of rows) {
    // Merge di atas default: kunci baru di content.ts tetap terisi walau baris DB masih blob versi lama.
    if (row.key in map) (map as any)[row.key] = { ...(map as any)[row.key], ...(row.data as object) };
  }
  return map;
}

export async function getSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export function waLink(number: string, message: string) {
  return `https://wa.me/${String(number).replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}
