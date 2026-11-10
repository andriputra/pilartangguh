import { NextRequest } from "next/server";
import { guard, isResponse } from "@/lib/api";
import { badRequest } from "@/lib/auth";
import { changeUserPassword, readUserJson } from "@/lib/users";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await readUserJson(req);
  if (isResponse(body)) return body;
  if (params.id === g.sub) return badRequest("Gunakan /api/admin/password untuk mengganti password sendiri");
  return changeUserPassword(g, params.id, body);
}
