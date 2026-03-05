import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, appOrigin } from "@/lib/mailer";
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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const cert = await (prisma as any).certificate.findFirst({ where: { userId, mainModuleId: null } });
  if (!cert) return NextResponse.json({ message: "No certificate issued for this user" }, { status: 404 });

  const origin = appOrigin();
  const downloadLink = `${origin}/api/certificate/download`;

  await sendEmail({
    to: user.email,
    subject: "Your Training Certificate is Ready",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#5a3e28;">Congratulations, ${user.name || user.email}!</h2>
        <p>You have successfully completed all required training modules. Your certificate is now available for download.</p>
        <p style="margin:24px 0;">
          <a href="${downloadLink}" style="background:#5a3e28;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
            Download Certificate
          </a>
        </p>
        <p style="color:#666;font-size:13px;">If the button above doesn't work, copy and paste this link into your browser:<br/>${downloadLink}</p>
      </div>
    `,
    text: `Congratulations ${user.name || user.email}! Your training certificate is ready. Download it here: ${downloadLink}`,
  });

  return NextResponse.json({ ok: true });
}
