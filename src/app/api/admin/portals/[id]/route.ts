import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";
import { parsePortalInput } from "@/lib/portals";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  const data = parsePortalInput(await req.json().catch(() => null));
  if (isResponse(data)) return data;
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
