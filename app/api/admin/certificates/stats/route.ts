import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserEligible } from "@/lib/quiz";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true },
  });

  const certs = await (prisma as any).certificate.findMany({ where: { mainModuleId: null } });
  const certUserIds = new Set(certs.map((c: any) => c.userId));

  let eligibleCount = 0;
  let pendingCount = 0;

  for (const u of users) {
    const eligible = await isUserEligible(u.id);
    if (eligible) {
      eligibleCount++;
      if (!certUserIds.has(u.id)) pendingCount++;
    }
  }

  return NextResponse.json({
    totalUsers: users.length,
    eligibleUsers: eligibleCount,
    issuedCount: certs.length,
    pendingCount,
  });
}
