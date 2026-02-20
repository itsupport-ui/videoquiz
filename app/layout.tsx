import type { Metadata } from "next";
import Providers from "./providers";
import Header from "./header";
import UserShell from "./user-shell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import "./globals.css";
import { Inter, Merriweather } from "next/font/google";
import { LeafIcon } from "@/components/ui/AyurvedaIcons";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const merri = Merriweather({ subsets: ["latin"], weight: ["400","700"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "AyurvedaOne · Training Portal",
  description: "Employee training portal by AyurvedaOne Pvt Ltd — Learn, Quiz & Certify",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${inter.variable} ${merri.variable} bg-[var(--color-muted)] text-[var(--color-text)] min-h-screen antialiased flex flex-col overflow-x-hidden w-full`}>
        <Providers session={session}>
          <Header />
          <main className="flex-1 overflow-x-hidden w-full">
            <UserShell>{children}</UserShell>
          </main>
          {/* Footer */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <LeafIcon className="w-4 h-4 text-[var(--color-brand)] opacity-50" />
            <span className="text-sm">
              &copy; {new Date().getFullYear()} AyurvedaOne Pvt Ltd. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
            <span>Powered by Ayurveda Wisdom</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

