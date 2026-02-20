// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Redirect logged-in users away from auth pages
    const authPages = ["/login", "/signup", "/forgot", "/reset", "/verify"];
    if (token && authPages.some(page => path.startsWith(page))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const url = req.nextUrl.pathname;
        // Allow unauthenticated access to public auth pages and NextAuth endpoints
        const publicPaths = [
          "/login",
          "/forgot",
          "/reset",
          "/verify",
          "/signup",
          "/api/auth",
        ];
        if (!token) return publicPaths.some((p) => url.startsWith(p));
        // Admin-only protection
        if (url.startsWith("/admin")) return (token as any).role === "ADMIN";
        return true;
      },
    },
  }
);
export const config = { matcher: ["/((?!_next|favicon.ico|public).*)"] };
