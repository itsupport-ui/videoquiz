import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCertificatePdf } from "@/lib/cert";
import { isUserEligible, computeUserOverallScore, getUserCompletionDate } from "@/lib/quiz";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureFileForUser(userId: string): Promise<string | null> {
  const eligible = await isUserEligible(userId);
  if (!eligible) return null;
  const cert = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
  if (cert && fs.existsSync(cert.filePath)) return cert.filePath;
  // Regenerate if eligible but file missing
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  try {
    const overallScore = await computeUserOverallScore(userId);
    const completionDate = await getUserCompletionDate(userId);
    const filePath = await generateCertificatePdf({
      userName: user.name || user.email,
      userEmail: user.email,
      overallScore,
      contextTitle: "All Main Modules",
      completionDate,
    });
    if (cert) {
      await (prisma as any).certificate.update({ where: { id: cert.id }, data: { filePath, totalScore: overallScore, issuedAt: new Date() } });
    } else {
      await (prisma as any).certificate.create({ data: { userId, mainModuleId: null, filePath, totalScore: overallScore } });
    }
    return filePath;
  } catch (err) {
    console.error("[certificate/download ensureFileForUser]", err);
    return null;
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId");

  let userId = session.user.id as string;
  if (requestedUserId && requestedUserId !== userId) {
    // Only admins may download for others
    if ((session.user as any).role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    userId = requestedUserId;
  }

  const filePath = await ensureFileForUser(userId);
  if (!filePath) return NextResponse.json({ message: "Not found" }, { status: 404 });

  try {
    const buf = await fs.promises.readFile(filePath);
    const name = path.basename(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}
