import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ items: z.array(z.object({ id: z.number().int().positive(), orderIndex: z.number().int().positive() })) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { items } = parsed.data;
  for (const it of items) {
    await (prisma as any).mainModule.update({ where: { id: it.id }, data: { orderIndex: it.orderIndex } });
  }
  return NextResponse.json({ ok: true });
}
