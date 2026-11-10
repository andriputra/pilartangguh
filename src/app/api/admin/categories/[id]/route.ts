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
  if (body.name) data.name = String(body.name);
  if (body.slug) data.slug = slugify(body.slug);
  if (body.order !== undefined) data.order = Number(body.order || 0);
  const category = await prisma.category.update({ where: { id: params.id }, data });
  revalidatePath("/");
  return Response.json(category);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  await prisma.category.delete({ where: { id: params.id } });
  revalidatePath("/");
  return Response.json({ ok: true });
}
