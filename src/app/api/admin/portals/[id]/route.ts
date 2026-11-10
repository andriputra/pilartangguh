import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const key of ["title", "description", "url", "tag", "status"]) {
    if (key in body) data[key] = body[key] === "" ? null : body[key];
  }
  if ("dark" in body) data.dark = Boolean(body.dark);
  if ("published" in body) data.published = Boolean(body.published);
  if ("number" in body) data.number = Number(body.number || 1);
  if ("order" in body) data.order = Number(body.order || 0);
  const row = await prisma.portalLink.update({ where: { id: params.id }, data });
  revalidatePath("/");
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  await prisma.portalLink.delete({ where: { id: params.id } });
  revalidatePath("/");
  return Response.json({ ok: true });
}
