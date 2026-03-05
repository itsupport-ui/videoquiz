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

  const overallScore = await computeUserOverallScore(session.user.id);
  const filePath = await generateCertificatePdf({
    userName: session.user.name || "User",
    userEmail: session.user.email || session.user.id,
    overallScore,
    contextTitle: "All Main Modules Completed",
  });

  await (prisma as any).certificate.upsert({
    where: { userId_mainModuleId: { userId: session.user.id, mainModuleId: null } },
    update: { filePath, totalScore: overallScore, issuedAt: new Date() },
    create: { userId: session.user.id, mainModuleId: null, filePath, totalScore: overallScore },
  });

  return NextResponse.json({ url: `/api/certificate/download` });
}

