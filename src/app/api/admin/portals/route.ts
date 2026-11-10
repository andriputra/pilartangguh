import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";
import { parsePortalInput } from "@/lib/portals";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  return Response.json(
    await prisma.portalLink.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { videos: true } }, videos: { orderBy: { publishedAt: "desc" }, take: 1 } },
    })
  );
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const data = parsePortalInput(await req.json().catch(() => null));
  if (isResponse(data)) return data;
  if (!data.title) return Response.json({ error: "Judul wajib diisi" }, { status: 400 });
  const count = await prisma.portalLink.count();
  const row = await prisma.portalLink.create({
    data: {
      ...data,
      title: data.title,
      description: data.description ?? "",
      number: data.number ?? count + 1,
      order: data.order ?? count,
    },
  });
  revalidatePath("/");
  return Response.json(row, { status: 201 });
}
