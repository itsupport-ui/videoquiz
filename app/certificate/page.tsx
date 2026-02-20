import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Award, Download, Lock, ArrowLeft, FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CertificatePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const res = await fetch(`/api/certificate`, { cache: "no-store" });
  let data: any;
  try {
    data = await res.json();
  } catch (e) {
    return (
      <main className="max-w-[500px] mx-auto p-4 md:p-6 animate-fade-in">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] text-center">
          <div className="p-3 rounded-full bg-[var(--color-error-light)] w-14 h-14 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-[var(--color-error)]" />
          </div>
          <h1 className="text-lg font-bold text-[var(--color-brown)] mb-2" style={{ fontFamily: "var(--font-serif)" }}>Certificate</h1>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Failed to load certificate status. Please refresh.</p>
          <Link href="/" className="btn btn-ghost text-sm">Back to Dashboard</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[500px] mx-auto p-4 md:p-6 animate-fade-in">
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] overflow-hidden">
        {/* Color strip */}
        <div className={`h-1.5 ${data.url ? "bg-[var(--color-brand)]" : data.eligible ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />

        <div className="p-6 md:p-8 text-center">
          {/* Icon */}
          <div className={`p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 ${
            data.url ? "bg-[var(--color-brand-50)]" : data.eligible ? "bg-[var(--color-accent-50)]" : "bg-[var(--color-cream-dark)]"
          }`}>
            {data.url ? <Award className="w-8 h-8 text-[var(--color-brand)]" /> : data.eligible ? <FileText className="w-8 h-8 text-[var(--color-accent)]" /> : <Lock className="w-7 h-7 text-[var(--color-text-muted)]" />}
          </div>

          <h1 className="text-xl font-bold text-[var(--color-brown)] mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Certificate
          </h1>

          {data.url ? (
            <>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">Your certificate is ready for download.</p>
              <a href={data.url} target="_blank" className="btn btn-primary inline-flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </>
          ) : data.eligible ? (
            <>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">You have completed all modules. Generate your certificate now.</p>
              <form action="/api/certificate" method="post">
                <button type="submit" className="btn btn-accent inline-flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Generate Certificate
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              Complete all modules to unlock your certificate.
            </p>
          )}

          <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
            <Link href="/" className="text-sm text-[var(--color-brand)] hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
