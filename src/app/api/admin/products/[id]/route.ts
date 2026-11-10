import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse, slugify } from "@/lib/api";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const key of ["name", "image", "badge", "description", "categoryId"]) {
    if (key in body) data[key] = body[key] === "" ? null : body[key];
  }
  if ("order" in body) data.order = Number(body.order || 0);
  if ("published" in body) data.published = Boolean(body.published);
  if ("slug" in body && body.slug) data.slug = slugify(body.slug);
  const product = await prisma.product.update({ where: { id: params.id }, data, include: { category: true } });
  revalidatePath("/");
  return Response.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  await prisma.product.delete({ where: { id: params.id } });
  revalidatePath("/");
  return Response.json({ ok: true });
}
