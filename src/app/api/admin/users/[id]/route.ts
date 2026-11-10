import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";
import { publicUserSelect, readUserJson, readProfile, userMutationError } from "@/lib/users";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await readUserJson(req);
  if (isResponse(body)) return body;
  const profile = readProfile(body);
  if (isResponse(profile)) return profile;
  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: profile,
      select: publicUserSelect,
    });
    return Response.json(user);
  } catch (error) {
    return userMutationError(error);
  }
}
