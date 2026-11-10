import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE = "pt_admin_token";
const TOKEN_TTL = "12h";

function secret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(raw);
}

export async function signToken(payload: { sub: string; email: string; name: string; sessionVersion: number }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      requiredClaims: ["sub", "email", "name", "sessionVersion", "iat", "exp"],
    });
    if (typeof payload.sub !== "string" || !payload.sub ||
        typeof payload.email !== "string" || typeof payload.name !== "string" ||
        typeof payload.sessionVersion !== "number" ||
        !Number.isSafeInteger(payload.sessionVersion) || payload.sessionVersion < 0) return null;
    return { sub: payload.sub, email: payload.email, name: payload.name, sessionVersion: payload.sessionVersion };
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearAuthCookie() {
  cookies().set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSession() {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, role: true, sessionVersion: true },
  });
  if (!user || user.role !== "admin" || user.sessionVersion !== payload.sessionVersion) return null;
  return { sub: user.id, email: user.email, name: user.name, sessionVersion: user.sessionVersion };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new AuthError();
  return session;
}

export class AuthError extends Error {}

export function unauthorized() {
  return Response.json({ error: "Sesi tidak valid. Silakan masuk kembali" }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}
