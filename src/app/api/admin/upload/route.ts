import { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { guard, isResponse } from "@/lib/api";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "File wajib diupload" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Maksimum ukuran file 8MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filename = `${id}.webp`;
  let data: Buffer;
  try {
    data = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return Response.json({ error: "Format gambar tidak didukung" }, { status: 400 });
  }

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), data);
  return Response.json({ url: `/uploads/${filename}` });
}
