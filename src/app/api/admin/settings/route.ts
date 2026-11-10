import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  return Response.json(await prisma.setting.findMany());
}

export async function PUT(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.values !== "object") {
    return Response.json({ error: "values wajib diisi" }, { status: 400 });
  }
  const entries = Object.entries(body.values as Record<string, string>);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );
  revalidatePath("/");
  return Response.json({ ok: true });
}
