import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse, slugify } from "@/lib/api";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  return Response.json(await prisma.category.findMany({ orderBy: { order: "asc" } }));
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => null);
  if (!body?.name) return Response.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
  const count = await prisma.category.count();
  const category = await prisma.category.create({
    data: { name: String(body.name), slug: slugify(body.slug || body.name), order: Number(body.order ?? count) },
  });
  revalidatePath("/");
  return Response.json(category, { status: 201 });
}
