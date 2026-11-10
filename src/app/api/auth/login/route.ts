import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, signToken, setAuthCookie } from "@/lib/auth";
import { isResponse } from "@/lib/api";
import { readEmail, readUserJson, validCurrentPassword } from "@/lib/users";

export async function POST(req: NextRequest) {
  const body = await readUserJson(req);
  if (isResponse(body)) return body;
  const email = readEmail(body.email);
  if (isResponse(email)) return email;
  if (!validCurrentPassword(body.password)) {
    return badRequest("Password wajib diisi dan maksimal 72 byte UTF-8");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "admin" || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return Response.json({ error: "Email atau password salah" }, { status: 401 });
  }
  const token = await signToken({ sub: user.id, email: user.email, name: user.name, sessionVersion: user.sessionVersion });
  setAuthCookie(token);
  return Response.json({ ok: true, name: user.name });
}
