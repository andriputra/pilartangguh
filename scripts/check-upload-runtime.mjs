import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

const [app, base] = process.argv.slice(2);
assert.ok(app && base, "Usage: node scripts/check-upload-runtime.mjs APP_DIRECTORY BASE_URL");
assert.equal(new URL(base).hostname, "127.0.0.1", "Runtime checks must target the local server");
const ready = await fetch(`${base}/admin/login`, { signal: AbortSignal.timeout(15000) });
await ready.body?.cancel();
assert.equal(ready.status, 200, "App must be ready before the upload probe is created");

const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
const file = path.join(app, "public", "uploads", filename);
const image = await readFile(path.join(app, "public", "images", "portal-agen-benang-bandung.webp"));
await writeFile(file, image, { flag: "wx" });
try {
  const response = await fetch(`${base}/uploads/${filename}`, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, "New uploads are not served by the deployed runtime");
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
  console.log("PASS: newly created upload is served correctly without a restart");
} finally {
  await unlink(file);
}
