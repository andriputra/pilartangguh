import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3011";
const localHosts = ["localhost", "127.0.0.1", "[::1]"];
if (!localHosts.includes(new URL(base).hostname) || !localHosts.includes(new URL(process.env.DATABASE_URL).hostname)) {
  throw new Error("Pengujian pengguna hanya boleh memakai server dan database lokal.");
}

async function request(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, headers: response.headers };
}

async function login(email, password) {
  const response = await request("/api/auth/login", { method: "POST", body: { email, password } });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  return cookie;
}

function publicUser(user) {
  assert.deepEqual(Object.keys(user).sort(), ["id", "name", "email", "role", "createdAt"].sort());
}

await test("CMS users and password lifecycle", async (t) => {
  const prisma = new PrismaClient();
  const suffix = `${randomUUID()}@example.test`;
  const password = "Test-only-Password-123!";
  const nextPassword = "Test-only-Password-456!";
  const email = `actor-${suffix}`;
  const targetEmail = `target-${suffix}`;
  const createdIds = [];
  try {
    const actor = await prisma.user.create({ data: { name: "Test Admin", email, passwordHash: await bcrypt.hash(password, 12) } });
    createdIds.push(actor.id);
    let actorCookie = await login(email, password);
    let target;

    await t.test("anonymous, malformed requests and cross-origin writes are rejected", async () => {
      assert.equal((await request("/api/admin/users")).status, 401);
      for (const [path, method] of [["/api/admin/users", "POST"], [`/api/admin/users/${actor.id}`, "PATCH"], ["/api/admin/password", "PUT"], [`/api/admin/users/${actor.id}/password`, "PUT"]]) {
        assert.equal((await request(path, { method, body: {} })).status, 401);
      }
      for (const body of [null, [], "bad", { email: 1, password: {} }]) {
        assert.equal((await request("/api/admin/users", { method: "POST", cookie: actorCookie, body })).status, 400);
      }
      assert.equal((await request("/api/admin/users", { method: "POST", cookie: actorCookie, body: {}, headers: { Origin: "https://other.example.test" } })).status, 403);
      assert.equal((await request("/api/auth/login", { method: "POST", body: null })).status, 400);
    });

    await t.test("add user with normalized email and validate passwords", async () => {
      const draft = { name: "Test Member", email: targetEmail.toUpperCase(), password, confirmPassword: password };
      for (const bad of [{ name: " " }, { email: "not-an-email" }, { password: "short", confirmPassword: "short" }, { confirmPassword: "different" }, { password: "é".repeat(37), confirmPassword: "é".repeat(37) }]) {
        assert.equal((await request("/api/admin/users", { method: "POST", cookie: actorCookie, body: { ...draft, ...bad } })).status, 400);
      }
      const result = await request("/api/admin/users", { method: "POST", cookie: actorCookie, body: draft });
      assert.equal(result.status, 201);
      target = result.data;
      createdIds.push(target.id);
      publicUser(target);
      assert.equal(target.email, targetEmail);
      assert.equal(target.role, "admin");
      const stored = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
      assert.notEqual(stored.passwordHash, password);
      assert.equal(await bcrypt.compare(password, stored.passwordHash), true);
      assert.equal((await request("/api/admin/users", { method: "POST", cookie: actorCookie, body: draft })).status, 409);
      const list = await request("/api/admin/users", { cookie: actorCookie });
      assert.equal(list.status, 200);
      assert.equal(list.data.currentUserId, actor.id);
      list.data.items.forEach(publicUser);
    });

    await t.test("edit profile, reject duplicates, and keep hashes out of responses", async () => {
      const result = await request(`/api/admin/users/${target.id}`, { method: "PATCH", cookie: actorCookie, body: { name: "Updated Member", email: targetEmail } });
      assert.equal(result.status, 200);
      publicUser(result.data);
      assert.equal(result.data.name, "Updated Member");
      assert.equal((await request(`/api/admin/users/${target.id}`, { method: "PATCH", cookie: actorCookie, body: { name: "Updated Member", email } })).status, 409);
      assert.equal((await request("/api/admin/users/missing-user", { method: "PATCH", cookie: actorCookie, body: { name: "Missing Member", email: `missing-${suffix}` } })).status, 404);
      assert.equal((await request(`/api/admin/users/${target.id}`, { method: "PATCH", cookie: actorCookie, body: null })).status, 400);
    });

    await t.test("reset password invalidates target sessions, not the acting admin", async () => {
      const cookies = [await login(targetEmail, password), await login(targetEmail, password)];
      const path = `/api/admin/users/${target.id}/password`;
      const body = { currentPassword: password, password: nextPassword, confirmPassword: nextPassword };
      assert.equal((await request(path, { method: "PUT", cookie: actorCookie, body: { ...body, currentPassword: "wrong-current-password" } })).status, 401);
      assert.equal((await request(path, { method: "PUT", cookie: actorCookie, body: { ...body, password, confirmPassword: password } })).status, 400);
      assert.equal((await request(path, { method: "PUT", cookie: actorCookie, body: { ...body, confirmPassword: "mismatch" } })).status, 400);
      assert.equal((await request(`/api/admin/users/${actor.id}/password`, { method: "PUT", cookie: actorCookie, body })).status, 400);
      assert.equal((await request("/api/admin/users/missing-user/password", { method: "PUT", cookie: actorCookie, body })).status, 404);
      assert.equal((await request(path, { method: "PUT", cookie: actorCookie, body })).status, 200);
      for (const cookie of cookies) {
        assert.equal((await request("/api/admin/users", { cookie })).status, 401);
        assert.equal((await request("/api/admin/settings", { cookie })).status, 401);
        assert.equal((await request("/admin/settings", { cookie })).status, 307);
        assert.equal((await request("/admin/login", { cookie })).status, 200);
      }
      assert.equal((await request("/api/admin/users", { cookie: actorCookie })).status, 200);
      assert.equal((await request("/api/auth/login", { method: "POST", body: { email: targetEmail, password } })).status, 401);
      await login(targetEmail, nextPassword);
    });

    await t.test("own password change clears cookie and invalidates every previous session", async () => {
      const secondCookie = await login(email, password);
      const body = { currentPassword: password, password: nextPassword, confirmPassword: nextPassword };
      assert.equal((await request("/api/admin/password", { method: "PUT", cookie: actorCookie, body: { ...body, currentPassword: "wrong-current-password" } })).status, 401);
      const result = await request("/api/admin/password", { method: "PUT", cookie: actorCookie, body });
      assert.equal(result.status, 200);
      assert.match(result.headers.get("set-cookie"), /Max-Age=0/i);
      for (const cookie of [actorCookie, secondCookie]) assert.equal((await request("/api/admin/settings", { cookie })).status, 401);
      assert.equal((await request("/api/auth/login", { method: "POST", body: { email, password } })).status, 401);
      actorCookie = await login(email, nextPassword);
      assert.equal((await request("/api/admin/settings", { cookie: actorCookie })).status, 200);
    });

    await t.test("legacy, deleted-user and non-admin tokens cannot access CMS", async () => {
      const legacy = await new SignJWT({ sub: actor.id, email, name: actor.name }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode(process.env.AUTH_SECRET));
      assert.equal((await request("/api/admin/users", { cookie: `pt_admin_token=${legacy}` })).status, 401);
      const targetCookie = await login(targetEmail, nextPassword);
      await prisma.user.update({ where: { id: target.id }, data: { role: "editor" } });
      assert.equal((await request("/api/admin/users", { cookie: targetCookie })).status, 401);
      assert.equal((await request("/api/auth/login", { method: "POST", body: { email: targetEmail, password: nextPassword } })).status, 401);
      await prisma.user.delete({ where: { id: target.id } });
      assert.equal((await request("/api/admin/users", { cookie: targetCookie })).status, 401);
    });
  } finally {
    await prisma.user.deleteMany({ where: { OR: [{ id: { in: createdIds } }, { email: { endsWith: suffix } }] } });
    await prisma.$disconnect();
  }
});
