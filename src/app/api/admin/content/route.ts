import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";
import { SECTION_KEYS, type SectionKey } from "@/lib/content";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  return Response.json(await prisma.siteContent.findMany());
}

export async function PUT(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => null);
  if (!body?.key || body.data === undefined) {
    return Response.json({ error: "key dan data wajib diisi" }, { status: 400 });
  }
  if (!SECTION_KEYS.includes(body.key)) {
    return Response.json({ error: "Section tidak dikenal" }, { status: 400 });
  }
  const row = await prisma.siteContent.upsert({
    where: { key: body.key as SectionKey },
    update: { data: body.data },
    create: { key: body.key, data: body.data },
  });
  revalidatePath("/");
  return Response.json(row);
}
