import { NextRequest, NextResponse } from "next/server";
import { authClient } from "./lib/auth-client-server";

const publicPaths = [
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-otp",
  "/api/auth",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public paths and API routes
  if (
    publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))
  ) {
    return NextResponse.next();
  }

  // Check session using better-auth client
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    },
  });

  if (!session?.user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|public|api/auth|api/trpc|api/stream|firebase-messaging-sw.js).*)",
  ],
};
