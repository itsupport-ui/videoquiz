import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMainModuleProgress } from "@/lib/quiz";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 2;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id: userId } = await params;
  const progress = await getMainModuleProgress(userId);

  const mainModulesTotal = progress.length;
  const mainModulesCompleted = progress.filter((m) => m.completed).length;
  const subModulesTotal = progress.reduce((s, m) => s + m.subModules.length, 0);
  const subModulesCompleted = progress.reduce(
    (s, m) => s + m.subModules.filter((sm) => sm.status === "PASSED").length,
    0
  );

  const mainModules = progress.map((m) => ({
    id: m.id,
    title: m.title,
    completed: m.completed,
    dashboardAverage: m.dashboardAverage,
    subModuleCount: m.subModules.length,
    subModulesCompleted: m.subModules.filter((sm) => sm.status === "PASSED").length,
    subModules: m.subModules.map((sm) => ({
      id: sm.id,
      title: sm.title,
      status: sm.status,
      attemptsUsed: sm.attemptsUsed,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - sm.attemptsUsed),
      lastScore: sm.lastScore ?? null,
      passScore: sm.passScore,
    })),
  }));

  return NextResponse.json({
    mainModulesTotal,
    mainModulesCompleted,
    subModulesTotal,
    subModulesCompleted,
    mainModules,
  });
}
