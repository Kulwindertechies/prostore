// middleware.ts (in root)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set sessionCartId if missing
  const sessionCartId = request.cookies.get("sessionCartId")?.value;
  if (!sessionCartId) {
    const newId = crypto.randomUUID();
    response.cookies.set("sessionCartId", newId, {
      path: "/", // make sure it's accessible app-wide
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Protect these routes (require login)
  const protectedPaths = [
    "/shipping-address",
    "/payment-method",
    "/place-order",
    "/profile",
    "/user",
    "/order",
    "/admin",
  ];
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtected) {
    // const token = await getToken({ req: request });
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    console.log("JWT Secret:", process.env.NEXTAUTH_SECRET);
    
    if (!token) {
      const signInUrl = new URL("/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

// Required by Next.js to match routes for middleware
export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|assets|static).*)",
  ],
};
