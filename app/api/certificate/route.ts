import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import { isUserEligible, computeUserOverallScore } from "@/lib/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const eligible = await isUserEligible(session.user.id);

  const existing = await (prisma as any).certificate.findFirst({
    where: { userId: session.user.id, mainModuleId: null },
  });

  const url = existing && eligible ? `/api/certificate/download` : undefined;
  return NextResponse.json({ eligible, url });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const eligible = await isUserEligible(session.user.id);
  if (!eligible) return NextResponse.json({ message: "Not eligible — complete all main modules first" }, { status: 400 });

  try {
    const userId = session.user.id as string;
    const overallScore = await computeUserOverallScore(userId);
    const filePath = await generateCertificatePdf({
      userName: session.user.name || "User",
      userEmail: session.user.email || userId,
      overallScore,
      contextTitle: "All Main Modules Completed",
    });
    const existing = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
    if (existing) {
      await (prisma as any).certificate.update({ where: { id: existing.id }, data: { filePath, totalScore: overallScore, issuedAt: new Date() } });
    } else {
      await (prisma as any).certificate.create({ data: { userId, mainModuleId: null, filePath, totalScore: overallScore } });
    }
    return NextResponse.json({ url: `/api/certificate/download` });
  } catch (err) {
    console.error("[certificate/POST]", err);
    return NextResponse.json({ message: err instanceof Error ? err.message : "Certificate generation failed" }, { status: 500 });
  }
}

