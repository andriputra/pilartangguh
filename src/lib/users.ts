import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { badRequest, unauthorized } from "@/lib/auth";
import { isResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function readUserJson(req: Request): Promise<Record<string, unknown> | Response> {
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return badRequest("Content-Type harus application/json");
  }
  const origin = req.headers.get("origin");
  if (origin !== null) {
    try {
      const url = new URL(origin);
      // Compare hosts, not schemes: TLS may terminate at the reverse proxy.
      if (!["http:", "https:"].includes(url.protocol) || url.host !== req.headers.get("host")?.toLowerCase()) {
        return Response.json({ error: "Asal permintaan tidak diizinkan" }, { status: 403 });
      }
    } catch {
      return badRequest("Asal permintaan tidak valid");
    }
  }
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest("Data harus berupa objek JSON");
  }
  return body as Record<string, unknown>;
}

export function readEmail(value: unknown): string | Response {
  if (typeof value !== "string") return badRequest("Email tidak valid");
  const email = value.trim().toLowerCase();
  const parts = email.split("@");
  const [local, domain] = parts;
  if (email.length > 254 || parts.length !== 2 || local.length > 64 ||
      !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(local) ||
      !domain.includes(".") || !domain.split(".").every((label) =>
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return badRequest("Email tidak valid");
  }
  return email;
}

export function readProfile(body: Record<string, unknown>) {
  if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100) {
    return badRequest("Nama harus terdiri dari 2–100 karakter");
  }
  const email = readEmail(body.email);
  if (isResponse(email)) return email;
  return { name: body.name.trim(), email };
}

export function validCurrentPassword(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Buffer.byteLength(value, "utf8") <= 72;
}

export function readNewPassword(body: Record<string, unknown>): string | Response {
  if (typeof body.password !== "string" || Array.from(body.password).length < 12 ||
      Buffer.byteLength(body.password, "utf8") > 72) {
    return badRequest("Password baru minimal 12 karakter dan maksimal 72 byte UTF-8");
  }
  if (typeof body.confirmPassword !== "string" || body.password !== body.confirmPassword) {
    return badRequest("Konfirmasi password tidak cocok");
  }
  return body.password;
}

export function userMutationError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return Response.json({ error: "Email sudah digunakan" }, { status: 409 });
    if (error.code === "P2025") return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    if (error.code === "P2034") return passwordConflict();
  }
  return Response.json({ error: "Perubahan pengguna gagal disimpan" }, { status: 500 });
}

function passwordConflict() {
  return Response.json({ error: "Data pengguna telah berubah. Silakan muat ulang dan coba lagi" }, { status: 409 });
}

export async function changeUserPassword(
  session: { sub: string; sessionVersion: number },
  targetId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const password = readNewPassword(body);
  if (isResponse(password)) return password;
  if (!validCurrentPassword(body.currentPassword)) {
    return badRequest("Password saat ini wajib diisi dan maksimal 72 byte UTF-8");
  }
  try {
    const select = { id: true, passwordHash: true, sessionVersion: true } as const;
    const actor = await prisma.user.findUnique({ where: { id: session.sub }, select });
    if (!actor || actor.sessionVersion !== session.sessionVersion) return unauthorized();
    if (!(await bcrypt.compare(body.currentPassword, actor.passwordHash))) {
      return Response.json({ error: "Password saat ini salah" }, { status: 401 });
    }
    const target = targetId === actor.id ? actor : await prisma.user.findUnique({ where: { id: targetId }, select });
    if (!target) return Response.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    if (await bcrypt.compare(password, target.passwordHash)) {
      return badRequest("Password baru harus berbeda dari password pengguna saat ini");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const update = {
      where: { id: target.id, sessionVersion: target.sessionVersion },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    };
    if (target.id === actor.id) {
      const result = await prisma.user.updateMany(update);
      return result.count === 1 ? Response.json({ ok: true }) : passwordConflict();
    }
    return await prisma.$transaction(async (tx) => {
      // Lock and recheck the actor without revoking their sessions during a target reset.
      const operator = await tx.user.updateMany({
        where: { id: actor.id, sessionVersion: actor.sessionVersion },
        data: { sessionVersion: { increment: 0 } },
      });
      if (operator.count !== 1) return unauthorized();
      const result = await tx.user.updateMany(update);
      return result.count === 1 ? Response.json({ ok: true }) : passwordConflict();
    });
  } catch (error) {
    return userMutationError(error);
  }
}
