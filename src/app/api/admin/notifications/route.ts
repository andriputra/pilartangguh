import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { read: false } }),
  ]);
  return Response.json({ items, unread });
}

export async function PUT() {
  const g = await guard();
  if (isResponse(g)) return g;
  await prisma.notification.updateMany({ where: { read: false }, data: { read: true } });
  return Response.json({ ok: true });
}
