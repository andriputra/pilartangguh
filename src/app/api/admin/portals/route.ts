import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  return Response.json(await prisma.portalLink.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] }));
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => null);
  if (!body?.title) return Response.json({ error: "Judul wajib diisi" }, { status: 400 });
  const count = await prisma.portalLink.count();
  const row = await prisma.portalLink.create({
    data: {
      title: String(body.title),
      description: String(body.description || ""),
      url: body.url ? String(body.url) : null,
      status: body.status === "SEGERA HADIR" ? "SEGERA HADIR" : "ONLINE",
      number: Number(body.number || count + 1),
      dark: Boolean(body.dark),
      order: Number(body.order ?? count),
      published: body.published !== false,
    },
  });
  revalidatePath("/");
  return Response.json(row, { status: 201 });
}
