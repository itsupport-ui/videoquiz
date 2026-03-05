import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserEligible } from "@/lib/quiz";
import fs from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").toLowerCase();
  const statusFilter = searchParams.get("status") || "all"; // all | issued | eligible | ineligible
  const sort = searchParams.get("sort") || "name"; // name | issuedAt
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";

  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, email: true, name: true },
    orderBy: sort === "name" ? { name: order as any } : { createdAt: order as any },
  });

  const certs = await (prisma as any).certificate.findMany({ where: { mainModuleId: null } });
  const certMap = new Map<string, any>();
  for (const c of certs) certMap.set(c.userId, c);

  const results = [];
  for (const u of users) {
    const nameMatch = !search || (u.name || "").toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    if (!nameMatch) continue;

    const cert = certMap.get(u.id);
    const eligible = await isUserEligible(u.id);
    const issued = !!cert;

    let status: "issued" | "eligible" | "ineligible";
    if (issued) status = "issued";
    else if (eligible) status = "eligible";
    else status = "ineligible";

    if (statusFilter !== "all" && statusFilter !== status) continue;

    results.push({
      userId: u.id,
      email: u.email,
      name: u.name,
      status,
      issuedAt: cert?.issuedAt ?? null,
      totalScore: cert?.totalScore ?? null,
      url: issued ? `/api/certificate/download?userId=${encodeURIComponent(u.id)}` : undefined,
    });
  }

  // Sort by issuedAt if requested (already sorted by name above for name sort)
  if (sort === "issuedAt") {
    results.sort((a, b) => {
      const da = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
      const db = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
      return order === "asc" ? da - db : db - da;
    });
  }

  return NextResponse.json({ rows: results });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ message: "userId required" }, { status: 400 });

  const cert = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
  if (!cert) return NextResponse.json({ message: "No certificate found" }, { status: 404 });

  // Delete file from disk
  try { if (fs.existsSync(cert.filePath)) fs.unlinkSync(cert.filePath); } catch {}

  await (prisma as any).certificate.delete({ where: { id: cert.id } });

  return NextResponse.json({ ok: true });
}

