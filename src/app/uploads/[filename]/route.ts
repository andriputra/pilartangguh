import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contentTypes: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export async function GET(_req: Request, { params }: { params: { filename: string } }) {
  const match = /^(\d{13}-[a-f0-9]{8})\.(webp|jpg|jpeg|png|gif|svg)$/.exec(params.filename);
  if (!match) return new Response(null, { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(path.join(process.cwd(), "public", "uploads", params.filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": contentTypes[match[2]],
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
