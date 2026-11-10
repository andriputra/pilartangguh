import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  const [items, unread] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.contactMessage.count({ where: { read: false } }),
  ]);
  return Response.json({ items, unread });
}

export async function PATCH(req: Request) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => null);
  const read = Boolean(body?.read);
  const ids = Array.isArray(body?.ids) ? body.ids.map(String) : null;

  if (body?.all === true || !ids) {
    await prisma.contactMessage.updateMany({ where: read ? { read: false } : {}, data: { read } });
  } else {
    await prisma.contactMessage.updateMany({ where: { id: { in: ids } }, data: { read } });
  }
  return Response.json({ ok: true });
}
