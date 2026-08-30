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

  if (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    )
  ) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") ?? "";

  // TEMP DEBUG — remove once confirmed
  // console.log("[middleware] path:", pathname);
  // console.log("[middleware] cookie header present:", cookieHeader.length > 0);
  // console.log(
  //   "[middleware] session_token present:",
  //   cookieHeader.includes("__Secure-better-auth.session_token"),
  // );

  const { data: session, error } = await authClient.getSession({
    fetchOptions: {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    },
  });

  // // TEMP DEBUG — remove once confirmed
  // console.log("[middleware] session result:", {
  //   hasUser: Boolean(session?.user),
  //   userId: session?.user?.id ?? null,
  //   error: error ?? null,
  // });

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
