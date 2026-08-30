import { NextRequest, NextResponse } from "next/server";

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
  const sessionUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/v1/auth/get-session`;

  // console.log("[middleware] path:", pathname);
  // console.log("[middleware] session URL:", sessionUrl);

  let session: { user?: unknown } | null = null;
  try {
    const res = await fetch(sessionUrl, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const rawBody = await res.text();

    //  console.log("[middleware] fetch status:", res.status);
    //  console.log("[middleware] raw body:", rawBody);

    session = rawBody ? JSON.parse(rawBody) : null;
  } catch (err) {
    //  console.log("[middleware] fetch threw:", err);
    session = null;
  }

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
