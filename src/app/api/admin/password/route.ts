import { NextRequest } from "next/server";
import { guard, isResponse } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";
import { changeUserPassword, readUserJson } from "@/lib/users";

export async function PUT(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await readUserJson(req);
  if (isResponse(body)) return body;
  const result = await changeUserPassword(g, g.sub, body);
  if (result.ok) clearAuthCookie();
  return result;
}
