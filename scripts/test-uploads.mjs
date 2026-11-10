import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3011";
const localHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
assert.ok(localHosts.has(new URL(base).hostname), "Upload tests must run against a local app");
assert.ok(localHosts.has(new URL(process.env.DATABASE_URL).hostname), "Upload tests must use a local database");
const prisma = new PrismaClient();
const files = new Set();

function track(url) {
  assert.match(url, /^\/uploads\/\d{13}-[a-f0-9]{8}\.webp$/);
  files.add(path.join(process.cwd(), "public", url));
}

async function upload(data, filename, cookie) {
  const form = new FormData();
  form.set("file", new Blob([data]), filename);
  const response = await fetch(`${base}/api/admin/upload`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
    body: form,
  });
  const body = await response.json();
  if (body.url) track(body.url);
  return { response, body };
}

async function fixture(extension, data) {
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`;
  const file = path.join(process.cwd(), "public", "uploads", filename);
  files.add(file);
  await writeFile(file, data);
  return `/uploads/${filename}`;
}

test("uploads remain available immediately after a production server starts", async (t) => {
  let actor;
  try {
    assert.equal((await fetch(base)).status, 200);
    const image = await readFile("public/images/portal-agen-benang-bandung.webp");
    const password = `Upload-test-${randomBytes(12).toString("hex")}`;
    actor = await prisma.user.create({ data: {
      name: "Upload regression test",
      email: `upload-test-${randomBytes(8).toString("hex")}@example.test`,
      passwordHash: await bcrypt.hash(password, 12),
    } });
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: actor.email, password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.getSetCookie().find(value => value.startsWith("pt_admin_token=")).split(";")[0];

    await t.test("anonymous uploads stay protected", async () => {
      assert.equal((await upload(image, "portal.webp")).response.status, 401);
    });

    await t.test("new authenticated uploads support immediate GET, HEAD, and repeat reads", async () => {
      const { response, body } = await upload(image, "portal.webp", cookie);
      assert.equal(response.status, 200);
      const result = await fetch(base + body.url);
      assert.equal(result.status, 200);
      assert.equal(result.headers.get("content-type"), "image/webp");
      assert.equal(result.headers.get("x-content-type-options"), "nosniff");
      assert.match(result.headers.get("cache-control"), /immutable/);
      const data = Buffer.from(await result.arrayBuffer());
      assert.ok((await sharp(data).metadata()).width > 0);
      assert.deepEqual(data, await readFile(path.join(process.cwd(), "public", body.url)));
      const head = await fetch(base + body.url, { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal(Number(head.headers.get("content-length")), data.length);
      assert.equal((await head.arrayBuffer()).byteLength, 0);
      assert.deepEqual(Buffer.from(await (await fetch(base + body.url)).arrayBuffer()), data);
    });

    await t.test("legacy raster extensions and SVG responses keep their correct types", async () => {
      for (const [extension, type] of [["png", "image/png"], ["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["gif", "image/gif"]]) {
        const data = await sharp(image).resize(16).toFormat(extension === "jpg" ? "jpeg" : extension).toBuffer();
        const url = await fixture(extension, data);
        const response = await fetch(base + url);
        assert.equal(response.status, 200, extension);
        assert.equal(response.headers.get("content-type"), type);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), data);
      }
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>';
      const response = await fetch(base + await fixture("svg", svg));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/svg+xml");
      assert.match(response.headers.get("content-security-policy"), /sandbox/);
      const converted = await upload(svg, "image.svg", cookie);
      assert.equal(converted.response.status, 200);
      assert.equal((await sharp(Buffer.from(await (await fetch(base + converted.body.url)).arrayBuffer())).metadata()).format, "webp");
    });

    await t.test("uploads already present at startup retain image access and sandbox headers", async () => {
      const svg = await fixture("svg", '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>');
      const webp = await fixture("webp", image);
      const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3012"], {
        env: { ...process.env, NODE_ENV: "production" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      const exited = once(server, "exit");
      let output = "";
      try {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error(`Production test server timed out: ${output}`)), 30000);
          server.on("error", error => { clearTimeout(timer); reject(error); });
          server.on("exit", code => { clearTimeout(timer); reject(new Error(`Production test server exited ${code}: ${output}`)); });
          server.stderr.on("data", data => { output += data; });
          server.stdout.on("data", data => {
            output += data;
            if (output.includes("Ready in")) { clearTimeout(timer); resolve(); }
          });
        });
        for (const url of [svg, webp]) {
          const response = await fetch("http://127.0.0.1:3012" + url);
          assert.equal(response.status, 200, url);
          assert.match(response.headers.get("content-security-policy"), /sandbox/);
          assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        }
      } finally {
        if (server.exitCode === null) server.kill();
        await exited;
      }
    });

    await t.test("invalid or oversized image content is rejected even with an image extension", async () => {
      for (const filename of ["fake.webp", "fake.jpg", "fake.svg", "fake.txt"]) {
        const { response } = await upload("<html><script>alert(1)</script></html>", filename, cookie);
        assert.equal(response.status, 400, filename);
      }
      assert.equal((await upload(Buffer.alloc(8 * 1024 * 1024 + 1), "large.webp", cookie)).response.status, 400);
      const missing = await fetch(`${base}/api/admin/upload`, { method: "POST", headers: { Cookie: cookie }, body: new FormData() });
      assert.equal(missing.status, 400);
    });

    await t.test("missing files, unsupported names, and traversal cannot expose files", async () => {
      for (const url of [
        `/uploads/${Date.now()}-${randomBytes(4).toString("hex")}.webp`,
        "/uploads/.env", "/uploads/123-abc.html", "/uploads/..%2F..%2F.env",
        "/uploads/..%5C..%5C.env", "/uploads/1794300383001-66a5b656.webp%00",
      ]) assert.equal((await fetch(base + url)).status, 404, url);
    });

    await t.test("bundled images and existing pages are unaffected", async () => {
      for (const imageName of ["portal-agen-benang-bandung.webp", "portal-rw-caper.webp", "portal-bincang-tpt.webp"]) {
        const response = await fetch(`${base}/images/${imageName}`);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), "image/webp");
      }
      for (const route of ["/", "/katalog", "/kontak", "/admin/login"]) assert.equal((await fetch(base + route)).status, 200);
    });
  } finally {
    if (actor) await prisma.user.deleteMany({ where: { id: actor.id, email: actor.email } });
    for (const file of files) await unlink(file);
    await prisma.$disconnect();
  }
});
