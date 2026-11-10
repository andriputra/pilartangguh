import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse, slugify } from "@/lib/api";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  const products = await prisma.product.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { category: true },
  });
  return Response.json(products);
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.categoryId) {
    return Response.json({ error: "Nama dan kategori wajib diisi" }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      name: String(body.name),
      slug: slugify(body.slug || body.name),
      image: body.image || null,
      badge: body.badge || null,
      description: body.description || null,
      order: Number(body.order || 0),
      published: body.published !== false,
      categoryId: String(body.categoryId),
    },
    include: { category: true },
  });
  revalidatePath("/");
  return Response.json(product, { status: 201 });
}
