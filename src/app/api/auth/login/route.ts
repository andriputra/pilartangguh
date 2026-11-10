import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return Response.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    return Response.json({ error: "Email atau password salah" }, { status: 401 });
  }
  const token = await signToken({ sub: user.id, email: user.email, name: user.name });
  setAuthCookie(token);
  return Response.json({ ok: true, name: user.name });
}
