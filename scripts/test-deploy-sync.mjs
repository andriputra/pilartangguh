import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const rsync = spawnSync("rsync", ["--version"], { encoding: "utf8" });

test("deployment preserves uploaded data without excluding compiled upload routes", { skip: rsync.error?.code === "ENOENT" ? "rsync is not installed" : false }, async () => {
  assert.equal(rsync.status, 0, rsync.stderr);
  const script = await readFile(new URL("./deploy-vps.sh", import.meta.url), "utf8");
  const commands = script.split(/\r?\n/).filter(line => line.startsWith("rsync -a --delete"));
  assert.equal(commands.length, 3);
  const root = await mkdtemp(path.join(os.tmpdir(), "pt-deploy-sync-"));
  const source = path.join(root, "source");
  const app = path.join(root, "app");
  async function put(relative, value) {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, value);
  }
  try {
    await put("source/.next/standalone/.next/server/app/uploads/[filename]/route.js", "compiled route");
    await put("source/.next/standalone/node_modules/package/uploads/index.js", "package code");
    await put("source/.next/standalone/.env", "build env must not replace runtime env");
    await put("source/.next/static/chunk.js", "static chunk");
    await put("source/public/images/portal.webp", "bundled image");
    await put("source/public/uploads/repository-image.webp", "must not copy");
    await put("app/public/uploads/customer.webp", "customer upload");
    await put("app/public/uploads/nested/customer.webp", "nested customer upload");
    await put("app/public/images/obsolete.webp", "obsolete asset");
    await put("app/.env", "runtime env");
    const result = spawnSync("bash", ["-e", "-c", commands.join("\n")], {
      cwd: source,
      env: { ...process.env, APP: app },
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    for (const [relative, expected] of [
      [".next/server/app/uploads/[filename]/route.js", "compiled route"],
      ["node_modules/package/uploads/index.js", "package code"],
      ["public/uploads/customer.webp", "customer upload"],
      ["public/uploads/nested/customer.webp", "nested customer upload"],
      ["public/images/portal.webp", "bundled image"],
      [".next/static/chunk.js", "static chunk"],
      [".env", "runtime env"],
    ]) assert.equal(await readFile(path.join(app, relative), "utf8"), expected, relative);
    await assert.rejects(access(path.join(app, "public/uploads/repository-image.webp")), { code: "ENOENT" });
    await assert.rejects(access(path.join(app, "public/images/obsolete.webp")), { code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
