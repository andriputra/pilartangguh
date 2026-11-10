import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => ({}));
  const message = await prisma.contactMessage.update({
    where: { id: params.id },
    data: { read: Boolean(body.read) },
  });
  return Response.json(message);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  await prisma.contactMessage.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
