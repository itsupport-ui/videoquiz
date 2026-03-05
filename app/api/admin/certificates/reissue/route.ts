import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import { isUserEligible, computeUserOverallScore, getUserCompletionDate } from "@/lib/quiz";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ userId: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  const { userId } = parsed.data;
  const eligible = await isUserEligible(userId);
  if (!eligible) return NextResponse.json({ message: "User not eligible" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
  try {
    const score = await computeUserOverallScore(userId);
    const completionDate = await getUserCompletionDate(userId);
    const filePath = await generateCertificatePdf({ userName: user.name || user.email, userEmail: user.email, overallScore: score, completionDate });
    const existing = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
    if (existing) {
      await (prisma as any).certificate.update({ where: { id: existing.id }, data: { filePath, totalScore: score, issuedAt: new Date() } });
    } else {
      await (prisma as any).certificate.create({ data: { userId, mainModuleId: null, filePath, totalScore: score } });
    }
    return NextResponse.json({ url: `/api/certificate/download?userId=${encodeURIComponent(userId)}` });
  } catch (err) {
    console.error("[reissue/POST]", err);
    return NextResponse.json({ message: err instanceof Error ? err.message : "Certificate generation failed" }, { status: 500 });
  }
}

