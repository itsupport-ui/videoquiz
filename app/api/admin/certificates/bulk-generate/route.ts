import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserEligible, computeUserOverallScore, getUserCompletionDate } from "@/lib/quiz";
import { generateCertificatePdf } from "@/lib/cert";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, email: true, name: true },
  });

  const existingCerts = await (prisma as any).certificate.findMany({ where: { mainModuleId: null } });
  const certUserIds = new Set(existingCerts.map((c: any) => c.userId));

  let generated = 0;
  let skipped = 0;

  for (const user of users) {
    if (certUserIds.has(user.id)) { skipped++; continue; }
    const eligible = await isUserEligible(user.id);
    if (!eligible) { skipped++; continue; }

    try {
      const score = await computeUserOverallScore(user.id);
      const completionDate = await getUserCompletionDate(user.id);
      const filePath = await generateCertificatePdf({
        userName: user.name || user.email,
        userEmail: user.email,
        overallScore: score,
        contextTitle: "All Main Modules Completed",
        completionDate,
      });
      await (prisma as any).certificate.upsert({
        where: { userId_mainModuleId: { userId: user.id, mainModuleId: null } },
        update: { filePath, totalScore: score, issuedAt: new Date() },
        create: { userId: user.id, mainModuleId: null, filePath, totalScore: score },
      });
      generated++;
    } catch (err) {
      console.error(`[bulk-generate] Failed for ${user.email}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ generated, skipped });
}
