import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "pt_admin_token";

async function hasValidToken(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token || !process.env.AUTH_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET), {
      algorithms: ["HS256"],
      requiredClaims: ["sub", "email", "name", "sessionVersion", "iat", "exp"],
    });
    return typeof payload.sub === "string" && payload.sub.length > 0 &&
      typeof payload.email === "string" && typeof payload.name === "string" &&
      typeof payload.sessionVersion === "number" &&
      Number.isSafeInteger(payload.sessionVersion) && payload.sessionVersion >= 0;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Revoked tokens may still be signed correctly; the DB-backed guard rejects them.
  if (pathname === "/admin/login") return NextResponse.next();
  const valid = await hasValidToken(req);

  if (!valid) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sesi tidak valid. Silakan masuk kembali" }, { status: 401 });
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
