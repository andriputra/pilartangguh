import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { guard, isResponse } from "@/lib/api";
import { unauthorized } from "@/lib/auth";
import { publicUserSelect, readUserJson, readProfile, readNewPassword, userMutationError } from "@/lib/users";

export async function GET() {
  const g = await guard();
  if (isResponse(g)) return g;
  const items = await prisma.user.findMany({ select: publicUserSelect, orderBy: { createdAt: "asc" } });
  return Response.json({ items, currentUserId: g.sub });
}

export async function POST(req: NextRequest) {
  const g = await guard();
  if (isResponse(g)) return g;
  const body = await readUserJson(req);
  if (isResponse(body)) return body;
  const profile = readProfile(body);
  if (isResponse(profile)) return profile;
  const password = readNewPassword(body);
  if (isResponse(password)) return password;
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    return await prisma.$transaction(async (tx) => {
      // Creating another administrator must not succeed through a revoked session.
      const actor = await tx.user.updateMany({
        where: { id: g.sub, sessionVersion: g.sessionVersion },
        data: { sessionVersion: { increment: 0 } },
      });
      if (actor.count !== 1) return unauthorized();
      const user = await tx.user.create({
        data: { ...profile, passwordHash, role: "admin" },
        select: publicUserSelect,
      });
      return Response.json(user, { status: 201 });
    });
  } catch (error) {
    return userMutationError(error);
  }
}
