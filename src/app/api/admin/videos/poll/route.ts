import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { guard, isResponse } from "@/lib/api";

const run = promisify(execFile);

export async function POST() {
  const g = await guard();
  if (isResponse(g)) return g;
  try {
    const { stdout, stderr } = await run(process.execPath, [path.join(process.cwd(), "scripts", "poll-youtube.mjs")], {
      timeout: 90_000,
      env: process.env,
    });
    return Response.json({ ok: true, log: `${stdout}\n${stderr}`.trim().slice(-4000) });
  } catch (e) {
    return Response.json({ error: "Polling gagal dijalankan", detail: String((e as Error)?.message || e) }, { status: 500 });
  }
}
